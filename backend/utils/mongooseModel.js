import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { Op } from "./mongoQuery.js";

const passwordHashRegex = /^\$2[aby]\$\d{2}\$/;
const aggregateSumFunctions = new Set(["SUM", "sum"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function likeToRegex(value) {
  const pattern = String(value || "")
    .split("%")
    .map(escapeRegExp)
    .join(".*");

  return new RegExp(pattern || ".*", "i");
}

function normalizeFieldValue(field, value) {
  if (field === "id" && value !== null && value !== undefined) {
    return String(value);
  }

  return value;
}

function normalizePlainDocument(document) {
  if (!document) return document;

  const plain = document.toObject
    ? document.toObject({ depopulate: true, transform: false, versionKey: false })
    : { ...document };

  delete plain._id;
  delete plain.__v;
  delete plain.password;

  return plain;
}

function translateFieldCondition(field, value) {
  if (Array.isArray(value)) {
    return { $in: value.map((item) => normalizeFieldValue(field, item)) };
  }

  if (!isPlainObject(value)) {
    return normalizeFieldValue(field, value);
  }

  const condition = {};

  for (const [operator, operatorValue] of Object.entries(value)) {
    if (operator === Op.like) {
      condition.$regex = likeToRegex(operatorValue);
      continue;
    }

    if (operator === Op.ne) {
      condition.$ne = normalizeFieldValue(field, operatorValue);
      continue;
    }

    if (operator === Op.gte) {
      condition.$gte = normalizeFieldValue(field, operatorValue);
      continue;
    }

    if (operator === Op.gt) {
      condition.$gt = normalizeFieldValue(field, operatorValue);
      continue;
    }

    if (operator === Op.lte) {
      condition.$lte = normalizeFieldValue(field, operatorValue);
      continue;
    }

    if (operator === Op.lt) {
      condition.$lt = normalizeFieldValue(field, operatorValue);
      continue;
    }

    if (operator === Op.in) {
      condition.$in = Array.isArray(operatorValue)
        ? operatorValue.map((item) => normalizeFieldValue(field, item))
        : [normalizeFieldValue(field, operatorValue)];
      continue;
    }

    condition[operator] = operatorValue;
  }

  return Object.keys(condition).length ? condition : value;
}

export function buildMongoFilter(where = {}) {
  const filter = {};

  for (const [field, value] of Object.entries(where || {})) {
    if (field === Op.or) {
      filter.$or = Array.isArray(value) ? value.map((item) => buildMongoFilter(item)) : [];
      continue;
    }

    if (field === Op.and) {
      filter.$and = Array.isArray(value) ? value.map((item) => buildMongoFilter(item)) : [];
      continue;
    }

    filter[field] = translateFieldCondition(field, value);
  }

  return filter;
}

function projectionFromAttributes(attributes) {
  if (!Array.isArray(attributes)) return null;

  const projection = {};

  for (const attribute of attributes) {
    if (typeof attribute === "string") {
      projection[attribute] = 1;
    }
  }

  return Object.keys(projection).length ? projection : null;
}

function sortFromOrder(order = []) {
  const sort = {};

  for (const entry of order) {
    if (!Array.isArray(entry)) continue;

    const [field, direction = "ASC"] = entry;
    if (typeof field !== "string") continue;

    sort[field] = String(direction).toUpperCase() === "DESC" ? -1 : 1;
  }

  return sort;
}

function getAggregateAlias(attribute, fallback) {
  if (Array.isArray(attribute) && typeof attribute[1] === "string") {
    return attribute[1];
  }

  return fallback;
}

function isFunctionExpression(value, name = "") {
  return value?.expression === "function" && (!name || String(value.name).toUpperCase() === name.toUpperCase());
}

function isColumnExpression(value, name = "") {
  return value?.expression === "column" && (!name || value.name === name);
}

function sumExpressionFromAttributes(attributes = []) {
  const aggregateAttribute = attributes.find((attribute) => Array.isArray(attribute) && isFunctionExpression(attribute[0]) && aggregateSumFunctions.has(attribute[0].name));

  if (!aggregateAttribute) return { alias: "total", field: "amount" };

  const aggregateFunction = aggregateAttribute[0];
  const column = aggregateFunction.args.find((item) => isColumnExpression(item));

  return {
    alias: getAggregateAlias(aggregateAttribute, "total"),
    field: column?.name || "amount",
  };
}

async function groupedResults(model, options = {}) {
  const match = buildMongoFilter(options.where);
  const group = options.group || [];
  const attributes = options.attributes || [];
  const pipeline = [];

  if (Object.keys(match).length) {
    pipeline.push({ $match: match });
  }

  const sum = sumExpressionFromAttributes(attributes);
  const groupField = Array.isArray(group) ? group.find((item) => typeof item === "string") : null;
  const dateGroup = Array.isArray(group) ? group.find((item) => isFunctionExpression(item, "DATE_FORMAT")) : null;

  if (groupField) {
    pipeline.push(
      {
        $group: {
          _id: `$${groupField}`,
          [sum.alias]: { $sum: { $toDouble: `$${sum.field}` } },
        },
      },
      {
        $project: {
          _id: 0,
          [groupField]: "$_id",
          [sum.alias]: 1,
        },
      },
    );
  } else if (dateGroup) {
    const column = dateGroup.args.find((item) => isColumnExpression(item));
    const dateField = column?.name || "createdAt";
    const alias = getAggregateAlias(attributes.find((attribute) => Array.isArray(attribute) && attribute[1] === "month"), "month");

    pipeline.push(
      {
        $group: {
          _id: { $dateToString: { date: `$${dateField}`, format: "%Y-%m" } },
          [sum.alias]: { $sum: { $toDouble: `$${sum.field}` } },
        },
      },
      {
        $project: {
          _id: 0,
          [alias]: "$_id",
          [sum.alias]: 1,
        },
      },
      { $sort: { [alias]: 1 } },
    );
  }

  if (!pipeline.length || (pipeline.length === 1 && pipeline[0].$match)) {
    return [];
  }

  return model.aggregate(pipeline);
}

function getUpsertFilter(payload) {
  for (const key of ["id", "settingKey", "buttonKey", "email", "slug", "transactionCode"]) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== "") {
      return { [key]: normalizeFieldValue(key, payload[key]) };
    }
  }

  return { id: randomUUID() };
}

export function objectIdStringDefault() {
  return this?._id?.toString?.() || new mongoose.Types.ObjectId().toString();
}

export function optionalObjectId(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  const text = String(value).trim();
  return mongoose.Types.ObjectId.isValid(text) ? text : null;
}

function applySerialization(schema, options = {}) {
  const hiddenFields = new Set(["__v", ...(options.hiddenFields || [])]);
  const hidePassword = options.hidePassword !== false;

  if (hidePassword) {
    hiddenFields.add("password");
  }

  const transform = (document, returned) => {
    if (options.hideInternalId !== false) {
      delete returned._id;
    }

    for (const field of hiddenFields) {
      delete returned[field];
    }

    if (typeof options.transform === "function") {
      return options.transform(document, returned) || returned;
    }

    return returned;
  };

  schema.set("toJSON", {
    transform,
    versionKey: false,
  });
  schema.set("toObject", {
    transform,
    versionKey: false,
  });
  schema.set("versionKey", false);
}

function applyPasswordHashing(schema) {
  schema.pre("save", async function hashPassword(next) {
    try {
      if (!this.isModified("password")) {
        next();
        return;
      }

      if (passwordHashRegex.test(String(this.password || ""))) {
        next();
        return;
      }

      const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
      this.password = await bcrypt.hash(this.password, saltRounds);
      next();
    } catch (error) {
      next(error);
    }
  });

  schema.methods.comparePassword = function comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(String(candidatePassword || ""), this.password);
  };
}

function applyCompatibilityMethods(schema) {
  schema.methods.update = async function updateDocument(patch = {}) {
    this.set(patch);
    await this.save();
    return this;
  };

  schema.methods.destroy = async function destroyDocument() {
    await this.deleteOne();
    return this;
  };

  schema.statics.scope = function scope() {
    return this;
  };

  schema.statics.findByPk = function findByPk(primaryKey) {
    return mongoose.Model.findOne.call(this, { id: String(primaryKey) }).exec();
  };

  schema.statics.findOne = function findOneCompat(options = {}, projection, queryOptions) {
    if (!options?.where && !options?.attributes && !options?.order && !options?.raw) {
      return mongoose.Model.findOne.call(this, options, projection, queryOptions);
    }

    const query = mongoose.Model.findOne.call(this, buildMongoFilter(options.where));
    const projectionFromOptions = projectionFromAttributes(options.attributes);

    if (projectionFromOptions) query.select(projectionFromOptions);

    const sort = sortFromOrder(options.order);
    if (Object.keys(sort).length) query.sort(sort);

    return options.raw ? query.lean().then(normalizePlainDocument) : query.exec();
  };

  schema.statics.findAll = async function findAll(options = {}) {
    if (options.group) {
      return groupedResults(this, options);
    }

    const query = mongoose.Model.find.call(this, buildMongoFilter(options.where));
    const projection = projectionFromAttributes(options.attributes);
    const sort = sortFromOrder(options.order);

    if (projection) query.select(projection);
    if (Object.keys(sort).length) query.sort(sort);
    if (Number.isFinite(Number(options.offset))) query.skip(Number(options.offset));
    if (Number.isFinite(Number(options.limit))) query.limit(Number(options.limit));

    const rows = await (options.raw ? query.lean() : query.exec());
    return options.raw ? rows.map(normalizePlainDocument) : rows;
  };

  schema.statics.findAndCountAll = async function findAndCountAll(options = {}) {
    const filter = buildMongoFilter(options.where);
    const [count, rows] = await Promise.all([
      mongoose.Model.countDocuments.call(this, filter),
      this.findAll(options),
    ]);

    return { count, rows };
  };

  schema.statics.count = function count(options = {}) {
    return mongoose.Model.countDocuments.call(this, buildMongoFilter(options.where));
  };

  schema.statics.sum = async function sum(field, options = {}) {
    const pipeline = [];
    const match = buildMongoFilter(options.where);

    if (Object.keys(match).length) {
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $group: {
        _id: null,
        total: { $sum: { $toDouble: `$${field}` } },
      },
    });

    const [result] = await this.aggregate(pipeline);
    return result?.total || 0;
  };

  schema.statics.destroy = async function destroy(options = {}) {
    const result = await mongoose.Model.deleteMany.call(this, buildMongoFilter(options.where));
    return result.deletedCount || 0;
  };

  schema.statics.findOrCreate = async function findOrCreate({ defaults = {}, where = {} } = {}) {
    const existing = await this.findOne({ where });

    if (existing) {
      return [existing, false];
    }

    try {
      const created = await this.create({ ...defaults, ...where });
      return [created, true];
    } catch (error) {
      if (error?.code === 11000) {
        const row = await this.findOne({ where });
        if (row) return [row, false];
      }

      throw error;
    }
  };

  schema.statics.upsert = async function upsert(payload = {}) {
    const filter = buildMongoFilter(getUpsertFilter(payload));
    const row = await mongoose.Model.findOneAndUpdate.call(this, filter, { $set: payload }, {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    }).exec();

    return [row, false];
  };
}

export function configureMongoSchema(schema, options = {}) {
  applySerialization(schema, options);

  if (options.hashPassword) {
    applyPasswordHashing(schema);
  }

  if (options.compatibility !== false) {
    applyCompatibilityMethods(schema);
  }

  return schema;
}

export function createMongoModel(name, fields, options = {}) {
  const timestamps = options.timestamps === undefined ? true : options.timestamps;
  const schema = new mongoose.Schema(
    {
      id: {
        default: options.singletonId ? String(options.singletonId) : randomUUID,
        index: true,
        required: true,
        type: String,
        unique: true,
      },
      ...fields,
    },
    {
      collection: options.collection,
      id: false,
      timestamps,
      toJSON: {
        transform(document, returned) {
          delete returned._id;
          delete returned.__v;
          delete returned.password;
          return returned;
        },
      },
      toObject: {
        transform(document, returned) {
          delete returned._id;
          delete returned.__v;
          delete returned.password;
          return returned;
        },
      },
      versionKey: false,
    },
  );

  for (const indexDefinition of options.indexes || []) {
    schema.index(indexDefinition.fields, indexDefinition.options || {});
  }

  if (options.hashPassword) {
    schema.pre("save", async function hashPassword(next) {
      try {
        if (!this.isModified("password")) {
          next();
          return;
        }

        if (passwordHashRegex.test(String(this.password || ""))) {
          next();
          return;
        }

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
      } catch (error) {
        next(error);
      }
    });

    schema.methods.comparePassword = function comparePassword(candidatePassword) {
      if (!this.password) return false;
      return bcrypt.compare(String(candidatePassword || ""), this.password);
    };
  }

  schema.methods.update = async function updateDocument(patch = {}) {
    this.set(patch);
    await this.save();
    return this;
  };

  schema.methods.destroy = async function destroyDocument() {
    await this.deleteOne();
    return this;
  };

  schema.statics.scope = function scope() {
    return this;
  };

  schema.statics.findByPk = function findByPk(primaryKey) {
    return mongoose.Model.findOne.call(this, { id: String(primaryKey) }).exec();
  };

  schema.statics.findOne = function findOneCompat(options = {}, projection, queryOptions) {
    if (!options?.where && !options?.attributes && !options?.order && !options?.raw) {
      return mongoose.Model.findOne.call(this, options, projection, queryOptions);
    }

    const query = mongoose.Model.findOne.call(this, buildMongoFilter(options.where));
    const projectionFromOptions = projectionFromAttributes(options.attributes);

    if (projectionFromOptions) query.select(projectionFromOptions);

    const sort = sortFromOrder(options.order);
    if (Object.keys(sort).length) query.sort(sort);

    return options.raw ? query.lean().then(normalizePlainDocument) : query.exec();
  };

  schema.statics.findAll = async function findAll(options = {}) {
    if (options.group) {
      return groupedResults(this, options);
    }

    const query = mongoose.Model.find.call(this, buildMongoFilter(options.where));
    const projection = projectionFromAttributes(options.attributes);
    const sort = sortFromOrder(options.order);

    if (projection) query.select(projection);
    if (Object.keys(sort).length) query.sort(sort);
    if (Number.isFinite(Number(options.offset))) query.skip(Number(options.offset));
    if (Number.isFinite(Number(options.limit))) query.limit(Number(options.limit));

    const rows = await (options.raw ? query.lean() : query.exec());
    return options.raw ? rows.map(normalizePlainDocument) : rows;
  };

  schema.statics.findAndCountAll = async function findAndCountAll(options = {}) {
    const filter = buildMongoFilter(options.where);
    const [count, rows] = await Promise.all([
      mongoose.Model.countDocuments.call(this, filter),
      this.findAll(options),
    ]);

    return { count, rows };
  };

  schema.statics.count = function count(options = {}) {
    return mongoose.Model.countDocuments.call(this, buildMongoFilter(options.where));
  };

  schema.statics.sum = async function sum(field, options = {}) {
    const pipeline = [];
    const match = buildMongoFilter(options.where);

    if (Object.keys(match).length) {
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $group: {
        _id: null,
        total: { $sum: { $toDouble: `$${field}` } },
      },
    });

    const [result] = await this.aggregate(pipeline);
    return result?.total || 0;
  };

  schema.statics.destroy = async function destroy(options = {}) {
    const result = await mongoose.Model.deleteMany.call(this, buildMongoFilter(options.where));
    return result.deletedCount || 0;
  };

  schema.statics.findOrCreate = async function findOrCreate({ defaults = {}, where = {} } = {}) {
    const existing = await this.findOne({ where });

    if (existing) {
      return [existing, false];
    }

    try {
      const created = await this.create({ ...defaults, ...where });
      return [created, true];
    } catch (error) {
      if (error?.code === 11000) {
        const row = await this.findOne({ where });
        if (row) return [row, false];
      }

      throw error;
    }
  };

  schema.statics.upsert = async function upsert(payload = {}) {
    const filter = buildMongoFilter(getUpsertFilter(payload));
    const row = await mongoose.Model.findOneAndUpdate.call(this, filter, { $set: payload }, {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    }).exec();

    return [row, false];
  };

  return mongoose.models[name] || mongoose.model(name, schema);
}
