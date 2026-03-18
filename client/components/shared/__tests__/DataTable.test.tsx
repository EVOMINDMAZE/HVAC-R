import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import "@testing-library/jest-dom";
import { DataTable } from "../DataTable";

type Row = {
  id: string;
  name: string;
};

const columns = [
  { key: "name", header: "Name" },
];

describe("DataTable", () => {
  it("renders unified error copy and retry action", () => {
    const onRetry = vi.fn();

    render(
      <DataTable<Row>
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
        errorMessage="Request timed out."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Unable to load table data.")).toBeInTheDocument();
    expect(screen.getByText("Request timed out.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("supports Enter and Space keyboard activation on clickable rows", () => {
    const onRowClick = vi.fn();

    render(
      <DataTable<Row>
        data={[{ id: "r1", name: "Alpha" }]}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={onRowClick}
      />,
    );

    const row = screen.getByText("Alpha").closest("tr");
    expect(row).toBeInTheDocument();

    fireEvent.keyDown(row as HTMLTableRowElement, { key: "Enter" });
    fireEvent.keyDown(row as HTMLTableRowElement, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
