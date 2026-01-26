"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface Column {
  key: string;
  header: string;
  width?: string;
}

interface PropertyTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  searchable?: boolean;
}

export function PropertyTable({
  columns,
  data,
  searchable = true,
}: PropertyTableProps) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(filter.toLowerCase()),
    ),
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey] as string | number;
    const valB = b[sortKey] as string | number;

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="my-8 border-2 border-black shadow-[4px_4px_0_#000] bg-white">
      {/* Header / Filter */}
      {searchable && (
        <div className="p-3 border-b-2 border-black flex items-center bg-neutral-50">
          <Search className="w-4 h-4 text-neutral-500 mr-2" />
          <input
            type="text"
            placeholder="Filter properties..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium w-full"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-black uppercase bg-[#FFD02F] border-b-2 border-black">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 font-black cursor-pointer hover:bg-[#E5B800] transition-colors select-none"
                  onClick={() => handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key &&
                      (sortDir === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-black/10 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 font-medium text-neutral-800 break-all"
                  >
                    {col.key === "type" ? (
                      <span className="font-mono text-xs text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                        {row[col.key] as React.ReactNode}
                      </span>
                    ) : (
                      (row[col.key] as React.ReactNode)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="p-8 text-center text-neutral-500 font-medium">
          No results found.
        </div>
      )}
    </div>
  );
}
