const roleWeight = {
    owner: 4,
    maintainer: 3,
    contributor: 2,
    viewer: 1
};
export function projectRoleAtLeast(actual, required) {
    return roleWeight[actual] >= roleWeight[required];
}
