'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Todo, {
        foreignKey: 'userId'
      })
    }

    static getUsers() {
      return User.findAll();
    }
  }
  User.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [5, 20],
          msg: "First Name should be more than five characters!"
        },
        notNull: true
      }
    },
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: {
        msg: "Email id already exists!" 
      },
      allowNull: false,
      validate: {
        isEmail: true,
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [5, 20],
          msg: "Password should be between 5 to 20 characters!"
        },
        notNull: true
      }
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};