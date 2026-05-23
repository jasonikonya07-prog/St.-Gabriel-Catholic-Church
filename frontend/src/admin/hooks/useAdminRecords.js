import { useCallback, useEffect, useState } from "react";
import { deleteRecord, getRecords, saveRecord } from "../services/adminApi";

export function useAdminRecords(moduleId) {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    const rows = await getRecords(moduleId);
    setRecords(rows);
    setIsLoading(false);
  }, [moduleId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const save = async (record) => {
    const nextRows = await saveRecord(moduleId, record);
    setRecords(nextRows);
  };

  const remove = async (recordId) => {
    const nextRows = await deleteRecord(moduleId, recordId);
    setRecords(nextRows);
  };

  return { isLoading, records, reload: loadRecords, remove, save };
}
