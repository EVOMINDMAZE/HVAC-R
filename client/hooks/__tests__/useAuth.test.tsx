import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth as useLegacyAuth } from "../auth.context";
import { AuthProvider } from "../useAuth";

const apiMocks = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    signIn: apiMocks.signInMock,
    signOut: apiMocks.signOutMock,
    getCurrentUser: apiMocks.getCurrentUserMock,
    signUp: vi.fn(),
  },
}));

describe("legacy useAuth provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("marks loading complete after mount", async () => {
    const { result } = renderHook(() => useLegacyAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("stores token and user on successful login", async () => {
    apiMocks.signInMock.mockResolvedValue({
      success: true,
      data: {
        user: {
          id: 1,
          email: "tech@example.com",
          first_name: "Tech",
          last_name: "User",
          subscription_plan: "free",
          subscription_status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: "token-123",
        expiresAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(() => useLegacyAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login("tech@example.com", "password123");
    });

    expect(localStorage.getItem("simulateon_token")).toBe("token-123");
    expect(localStorage.getItem("simulateon_user")).toContain("tech@example.com");
    expect(result.current.isAuthenticated).toBe(true);
  });
});
