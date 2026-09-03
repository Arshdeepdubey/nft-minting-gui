import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setTokens } from "../lib/auth";

export function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      navigate("/", { replace: true });
    } else {
      navigate("/login?error=1", { replace: true });
    }
    // Intentionally run once on mount: params/navigate are stable for this route.
  }, [params, navigate]);

  return <p>Signing you in...</p>;
}
