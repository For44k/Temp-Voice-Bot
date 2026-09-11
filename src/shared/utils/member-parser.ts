import { GuildMember, Role, Message } from "discord.js";

export interface TargetExtractionResult {
  members: GuildMember[];
  roles: Role[];
}

export async function extractTargetRoles(message: Message, args: string[], maxLimit = 4): Promise<Role[]> {
  const rolesMap = new Map<string, Role>();
  const guild = message.guild;
  if (!guild) return [];

  for (const [, role] of message.mentions.roles ?? []) {
    if (rolesMap.size >= maxLimit) break;
    if (role.id !== guild.roles.everyone.id) {
      rolesMap.set(role.id, role);
    }
  }

  const idPattern = /\b\d{17,20}\b/g;
  const rawText = args.join(" ");
  const matchedIds: string[] = rawText.match(idPattern) || [];

  if (guild.roles.cache.size <= 1) {
    await guild.roles.fetch().catch(() => {});
  }

  for (const id of matchedIds) {
    if (rolesMap.size >= maxLimit) break;
    if (!rolesMap.has(id)) {
      let role = guild.roles.cache.get(id);
      if (!role) {
        role = (await guild.roles.fetch(id).catch(() => null)) ?? undefined;
      }
      if (role && role.id !== guild.roles.everyone.id) {
        rolesMap.set(id, role);
      }
    }
  }

  if (rolesMap.size < maxLimit && args.length > 0) {
    const rawSearch = args.join(" ").replace(/^@/, "").trim().toLowerCase();
    const normalize = (str: string) => str.replace(/[\s\-_]+/g, "").toLowerCase();
    const normSearch = normalize(rawSearch);

    let exactRole = guild.roles.cache.find(
      (r) => r.id !== guild.roles.everyone.id && (r.name.toLowerCase() === rawSearch || normalize(r.name) === normSearch)
    );
    if (exactRole && !rolesMap.has(exactRole.id)) {
      rolesMap.set(exactRole.id, exactRole);
    }

    if (rolesMap.size === 0) {
      const startsRole = guild.roles.cache.find(
        (r) => r.id !== guild.roles.everyone.id && (r.name.toLowerCase().startsWith(rawSearch) || normalize(r.name).startsWith(normSearch))
      );
      if (startsRole && !rolesMap.has(startsRole.id)) {
        rolesMap.set(startsRole.id, startsRole);
      }
    }

    if (rolesMap.size === 0) {
      for (const arg of args) {
        if (rolesMap.size >= maxLimit) break;
        const cleanArg = arg.replace(/^@/, "").trim().toLowerCase();
        if (!cleanArg || matchedIds.includes(cleanArg) || /^\d{17,20}$/.test(cleanArg)) continue;
        const normArg = normalize(cleanArg);

        const role = guild.roles.cache.find(
          (r) =>
            r.id !== guild.roles.everyone.id &&
            (r.name.toLowerCase() === cleanArg ||
             r.name.toLowerCase().startsWith(cleanArg) ||
             normalize(r.name) === normArg ||
             normalize(r.name).startsWith(normArg))
        );
        if (role && !rolesMap.has(role.id)) {
          rolesMap.set(role.id, role);
        }
      }
    }
  }

  return Array.from(rolesMap.values()).slice(0, maxLimit);
}

export async function extractTargets(message: Message, args: string[], maxLimit = 4): Promise<TargetExtractionResult> {
  const roles = await extractTargetRoles(message, args, maxLimit);
  const members = await extractTargetMembers(message, args, maxLimit);
  return { members, roles };
}

export async function extractTargetMembers(message: Message, args: string[], maxLimit = 4): Promise<GuildMember[]> {
  const membersMap = new Map<string, GuildMember>();
  const guild = message.guild;
  if (!guild) return [];

  for (const [, member] of message.mentions.members ?? []) {
    if (membersMap.size >= maxLimit) break;
    membersMap.set(member.id, member);
  }

  const idPattern = /\b\d{17,20}\b/g;
  const rawText = args.join(" ");
  const matchedIds: string[] = rawText.match(idPattern) || [];

  for (const id of matchedIds) {
    if (membersMap.size >= maxLimit) break;
    if (!membersMap.has(id)) {
      if (guild.roles.cache.has(id)) continue;

      let member = guild.members.cache.get(id);
      if (!member) {
        member = (await guild.members.fetch(id).catch(() => null)) ?? undefined;
      }
      if (member) {
        membersMap.set(id, member);
      }
    }
  }

  if (membersMap.size < maxLimit && args.length > 0) {
    const knownSubs = new Set(["add", "remove", "del", "list", "clear", "@user", "username", "id", "@role", "rolename"]);
    for (const arg of args) {
      if (membersMap.size >= maxLimit) break;
      const cleanArg = arg.replace(/^@/, "").trim().toLowerCase();
      if (!cleanArg || knownSubs.has(cleanArg) || matchedIds.includes(cleanArg) || /^\d{17,20}$/.test(cleanArg)) continue;

      if (guild.roles.cache.some((r) => r.name.toLowerCase() === cleanArg)) continue;

      let found = guild.members.cache.find(
        (m) =>
          m.user.username.toLowerCase() === cleanArg ||
          m.user.globalName?.toLowerCase() === cleanArg ||
          m.displayName.toLowerCase() === cleanArg
      );

      if (!found && cleanArg.length >= 3) {
        try {
          const searched = await Promise.race([
            guild.members.search({ query: cleanArg, limit: 1 }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 350))
          ]);
          if (searched && "first" in searched) {
            found = searched.first();
          }
        } catch {}
      }

      if (found && !membersMap.has(found.id)) {
        membersMap.set(found.id, found);
      }
    }
  }

  return Array.from(membersMap.values()).slice(0, maxLimit);
}
