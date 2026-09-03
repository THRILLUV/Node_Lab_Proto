import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  backendUrl,
  frontendOrigins,
  supabaseAnonKey,
  supabaseServiceRole,
  supabaseUrl,
} from "../lib/core/env-names.mjs";

describe("official env aliases", () => {
  it("prefers the live test keys, then official Next/FastAPI names", () => {
    assert.equal(
      supabaseUrl({ SUPABASE_URL: "https://yrgaj.example", NEXT_PUBLIC_SUPABASE_URL: "https://official.example" }),
      "https://yrgaj.example",
    );
    assert.equal(supabaseUrl({ NEXT_PUBLIC_SUPABASE_URL: "https://official.example" }), "https://official.example");
    assert.equal(
      supabaseAnonKey({ SUPABASE_ANON_KEY: "anon-a", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-b" }),
      "anon-a",
    );
    assert.equal(supabaseAnonKey({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-b" }), "anon-b");
    assert.equal(
      supabaseServiceRole({ SUPABASE_SERVICE_ROLE: "sr-a", SUPABASE_SERVICE_ROLE_KEY: "sr-b" }),
      "sr-a",
    );
    assert.equal(supabaseServiceRole({ SUPABASE_SERVICE_ROLE_KEY: "sr-b" }), "sr-b");
    assert.equal(backendUrl({ BACKEND_URL: "https://api.example" }), "https://api.example");
    assert.deepEqual(
      frontendOrigins({ FRONTEND_ORIGIN: "https://app.example,http://localhost:3000" }),
      ["https://app.example", "http://localhost:3000"],
    );
    assert.deepEqual(frontendOrigins({}), []);
  });
});
