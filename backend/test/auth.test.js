import test from "node:test";
import assert from "node:assert/strict";
import { upsertUserFromProvider, findUserByEmail } from "../src/services/authService.js";

test("github auth user is created and updated using provider identity", async () => {
  const created = await upsertUserFromProvider({
    provider: "github",
    providerUserId: "github-test-user-1",
    email: "github-test@example.com",
    name: "GitHub Test User",
    avatarUrl: "https://example.com/avatar.png",
  });

  assert.equal(created.provider, "github");
  assert.equal(created.providerUserId, "github-test-user-1");

  const updated = await upsertUserFromProvider({
    provider: "github",
    providerUserId: "github-test-user-1",
    email: "github-test-updated@example.com",
    name: "Updated GitHub User",
    avatarUrl: "https://example.com/avatar-2.png",
  });

  assert.equal(updated.email, "github-test-updated@example.com");
  assert.equal(updated.name, "Updated GitHub User");

  const found = await findUserByEmail("github-test-updated@example.com");
  assert.equal(found?.providerUserId, "github-test-user-1");
});
