import type { ProjectRole } from '../schemas/projectMember.js';

const roleWeight: Record<ProjectRole, number> = {
    owner: 4,
    maintainer: 3,
    contributor: 2,
    viewer: 1
};

export function projectRoleAtLeast(actual: ProjectRole, required: ProjectRole) {
    return roleWeight[actual] >= roleWeight[required];
}
