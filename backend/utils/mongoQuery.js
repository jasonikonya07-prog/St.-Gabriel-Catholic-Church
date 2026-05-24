export const Op = Object.freeze({
  and: "$and",
  gte: "$gte",
  gt: "$gt",
  in: "$in",
  like: "$like",
  lte: "$lte",
  lt: "$lt",
  ne: "$ne",
  or: "$or",
});

export function col(name) {
  return { expression: "column", name };
}

export function fn(name, ...args) {
  return { args, expression: "function", name };
}
