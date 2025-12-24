const prisma = require('../prisma');

exports.getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                subscriptionEndsAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status, durationMonths } = req.body; // 'APPROVED' or 'REJECTED'

    try {
        let updateData = { status };

        // If approving, set subscription end date
        if (status === 'APPROVED' && durationMonths) {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));
            updateData.subscriptionEndsAt = endDate;
        }

        // Allow updating date directly
        if (req.body.subscriptionEndsAt) {
            updateData.subscriptionEndsAt = new Date(req.body.subscriptionEndsAt);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, status: true, subscriptionEndsAt: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
}
