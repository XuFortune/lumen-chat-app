// packages/api-core/src/models/ConversationSummary.ts
import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize';

class ConversationSummary extends Model<
    InferAttributes<ConversationSummary>,
    InferCreationAttributes<ConversationSummary>
> {
    declare id: CreationOptional<string>;
    declare conversation_id: string; // 绑定到会话
    declare summary: string; // 压缩后的对话摘要
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;
}

export function initConversationSummary(sequelize: any) {
    ConversationSummary.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            conversation_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Conversations',
                    key: 'id',
                },
            },
            summary: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'ConversationSummary',
            tableName: 'ConversationSummaries',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );
    return ConversationSummary;
}
