import serverless from "serverless-http";
import express from "express";

// Load the existing Express app from your local server file
// We use a dynamic import or regular import - but since it exports app, we'll import it.
// First we must manually export `app` from server/api.ts which we did using echo.
import { app } from "../../server/api";

// Wrap the Express app with serverless-http
export const handler = serverless(app);
