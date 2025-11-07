'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Conversations', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            user_id: {
                allowNull: false,
                type: Sequelize.UUID,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            title: {
                allowNull: false,
                type: Sequelize.STRING(255)
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.createTable('Messages', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            conversation_id: {
                allowNull: false,
                type: Sequelize.UUID,
                references: {
                    model: 'Conversations',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            role: {
                allowNull: false,
                type: Sequelize.STRING(16)
            },
            content: {
                allowNull: false,
                type: Sequelize.TEXT
            },
            metadata: {
                type: Sequelize.JSONB
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Messages');
        await queryInterface.dropTable('Conversations');
    }
};
