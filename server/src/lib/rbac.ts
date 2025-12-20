import type { OrgRole } from '../schemas/orgMember.js';

const weight: Record<OrgRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
};

export function orgRoleAtLeast(actual: OrgRole, required: OrgRole) {
    return weight[actual] >= weight[required];
}
