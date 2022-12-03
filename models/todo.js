"use strict";
const { Model, Op } = require("sequelize");
// const { toDefaultValue } = require("sequelize/types/utils");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Todo.belongsTo(models.User,{
        foreignKey: 'userId'
      })
    }

    static addTodo({ title, dueDate}, userId ) {
      // console.log("User ID:::" + userId);
      // console.log("Title:-" + title + "----");
      return this.create({ title: title, dueDate: dueDate, completed: false, userId: userId });
    }

    markAsCompleted() {
      return this.update({ 
        completed: true 
      });
    }

    setCompletionStatus(status){
      return this.update({ 
        completed: status, 
        
      }
      );
    }
    
    deleteTodo() {
      return Todo.destroy({
        where: {
          id: this.id
        }
      });
    }

    static getTodos() {
      return Todo.findAll();
    }

    static getOverdueTodos(userId){
      const overdueTodos = Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date()
          },
          completed:false,
          userId
        }
      });
      console.log("Overdue: " + overdueTodos);
      return overdueTodos;
    }

    static getDueTodayTodos(userId){
      const dueTodayTodos = Todo.findAll({
        where: {
          dueDate: new Date(),
          completed:false,
          userId
        },
        
      });
      return dueTodayTodos;
    }

    static getDueLaterTodos(userId)
    {
      const dueLaterTodos = Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date()
          },
          completed:false,
          userId
        }
      });
      return dueLaterTodos;
    }

    static getCompletedItems(userId)
    {
      const completedItems = Todo.findAll({
        where: {
          completed: true,
          userId
        }
      });
      return completedItems;
    }

    isOverdue()
    {
      if(this.id.dueDate < new Date())
        return true;
      else 
        return false;
    }
    isDueToday()
    {
      if(this.id.dueDate == new Date())
        return true;
      else 
        return false;
    }
    isDueLater()
    {
      if(this.id.dueDate > new Date())
        return true;
      else 
        return false;
    }

    displayableString() {
      let dateString = this.dueDate == new Date().toLocaleDateString("en-CA") ? "" : this.dueDate;        
      return `${this.title} ${ dateString} ${this.userId}`.trim();
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [5, 20],
            msg: 'Minimum 5 characters required in title.'
          },
          notNull: true
      }
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );

 

  return Todo;
};
