export function notFoundHandler() {
    return (req, res) => {
        res.status(404).json({ error: 'not_found', path: req.path });
    };
}
