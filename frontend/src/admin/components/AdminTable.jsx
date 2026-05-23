import DataTable from "./DataTable";

function AdminTable({ columns, emptyText = "No records found.", onDelete, onEdit, onView, rows = [] }) {
  return (
    <DataTable
      columns={columns}
      emptyMessage={emptyText}
      onDelete={onDelete ? (row) => onDelete(row.id, row) : undefined}
      onEdit={onEdit}
      onView={onView}
      pageSize={8}
      rows={rows}
      title="Records"
    />
  );
}

export default AdminTable;
