const weight = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
};
export function orgRoleAtLeast(actual, required) {
    return weight[actual] >= weight[required];
}
