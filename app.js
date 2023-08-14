//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/todoDB');

const itemsSchema = new mongoose.Schema ({
  name: String
});

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item ({
  name: "Welcome to your To-Do List!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find().then(foundItems => {

    if(foundItems.length === 0) {
      async function addItem() {
        await Item.insertMany(defaultItems);
      }
      addItem();
      res.redirect("/");
    }else{
      res.render("list", { listTitle: "Today",  newListItems: foundItems });
    }

  })

});

app.get("/:listName", function (req, res){
  const customListName = _.capitalize(req.params.listName);

  List.findOne({name: customListName}).then(foundItems => {
    if(!foundItems){
      //create a new list
      const list = new List ({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/"+customListName);
    }
    else{
      //show an existing list
      res.render("list", { listTitle: foundItems.name,  newListItems: foundItems.items });
    }
  })

  const list = new List ({
    name: customListName,
    items: defaultItems
  });

  list.save();

});

app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    await item.save();
    res.redirect("/");
  }else {
    const foundList = await List.findOne({name:listName})
    foundList.items.push(item);
    await foundList.save();
    res.redirect("/"+listName);
  }

});

app.post("/delete", async function (req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    await Item.deleteOne({ _id: checkedItemId });
    res.redirect("/");
  }
  else {
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
    res.redirect("/"+listName);
  }
  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
