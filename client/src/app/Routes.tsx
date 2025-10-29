import { lazy } from "react";
import { useRoutes } from "react-router-dom";
import HomePage from "../features/HomePage";

const SessionPage = lazy(() => import("../features/session/SessionPage"));
const AttendPage = lazy(() => import("../features/attendance/AttendPage"));
const AttendSuccessPage = lazy(() => import("../features/attendance/AttendSuccessPage"));
const AttendErrorPage = lazy(() => import("../features/attendance/AttendErrorPage"));
const ExportPage = lazy(() => import("../features/export/ExportPage"));
const ErrorPage = lazy(() => import("../features/ErrorPage"));

export function AppRoutes() {
  const attendChildren = [
    { index: true, element: <AttendPage /> },
    { path: "success", element: <AttendSuccessPage /> },
    { path: "error", element: <AttendErrorPage /> },
  ];
  const routes = [
    { path: "/", element: <HomePage /> },
    { path: "/session/:sessionId", element: <SessionPage /> },
    { path: "/attend/:sessionId/*", children: attendChildren },
    { path: "/export/:sessionId", element: <ExportPage /> },
    { path: "/error", element: <ErrorPage /> },
    { path: "*", element: <div style={{ padding: 24 }}>Page Not Found</div> },
  ];
  return useRoutes(routes);
}
