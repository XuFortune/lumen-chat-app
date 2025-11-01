'use strict';
const { v4: uuidv4 } = require('uuid');
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        username: 'demo_user_alpha',
        password: '123456', // 示例 bcrypt hash
        llm_configs: JSON.stringify({
          model_name: 'gpt-4o',
          temperature: 0.8,
          max_tokens: 1024
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'demo_user_beta',
        password: '654321', // 另一个示例 hash
        llm_configs: JSON.stringify({
          model_name: 'claude-3-sonnet',
          temperature: 0.5
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // 删除时根据已知的 username 删除，避免误删其他数据
    await queryInterface.bulkDelete('Users', {
      username: {
        [Sequelize.Op.in]: ['demo_user_alpha', 'demo_user_beta']
      }
    }, {});
  }
};
