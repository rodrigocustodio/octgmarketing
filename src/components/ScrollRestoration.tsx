import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "PUSH") {
      // Forward navigation (clicking links/buttons) - scroll to top
      window.scrollTo(0, 0);
    }
    // POP (back/forward browser buttons) - let browser handle scroll restoration
    // REPLACE - typically programmatic, scroll to top as well
    if (navigationType === "REPLACE") {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navigationType]);

  return null;
};

export default ScrollRestoration;
