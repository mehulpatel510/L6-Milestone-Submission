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
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    setCompletionStatus(status){
      return this.update({ completed: status });
    }
    
    deleteTodo() {
      return Todo.destroy({
        where: {
          id: this.id}
      });
    }

    static getTodos() {
      return Todo.findAll();
    }

    static getOverdueTodos(){
      const overdueTodos = Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date()
          },
          completed:false
        }
      });
      console.log("Overdue: " + overdueTodos);
      return overdueTodos;
    }

    static getDueTodayTodos(){
      const dueTodayTodos = Todo.findAll({
        where: {
          dueDate: new Date(),
          completed:false
        },
        
      });
      return dueTodayTodos;
    }

    static getDueLaterTodos()
    {
      const dueLaterTodos = Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date()
          },
          completed:false
        }
      });
      return dueLaterTodos;
    }

    static getCompletedItems()
    {
      const completedItems = Todo.findAll({
        where: {
          completed: true,
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
      return `${this.title} ${ dateString}`.trim();
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
