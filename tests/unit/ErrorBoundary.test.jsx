import { render, screen } from "@testing-library/react";

import { AppErrorBoundary as ErrorBoundary } from "@/components/composite/AppErrorBoundary";

import "../i18n";

const Broken = () => {
  throw new Error("boom");
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("без ошибки показывает содержимое", () => {
    render(
      <ErrorBoundary>
        <p>внутри</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("внутри")).toBeInTheDocument();
  });

  it("при ошибке рендера вместо белого экрана показывает алерт с кнопкой перезагрузки", () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /перезагр/i })).toBeInTheDocument();
  });
});
