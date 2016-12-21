//REQUIRE-------------------------------------------------------------------------------------------------------
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose'); 

//USE------------------------------------------------------------------------------------------------------------
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

//MONGOOSE SETTINGS---------------------------------------------
mongoose.connect('mongodb://localhost/msg_board');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

//SCHEMAS-------------------------------------------------------------------------------------------------------
var MessageSchema = new mongoose.Schema({
	name: {type: String, required: true, minlength: 4},
	content: {type: String, required: true, maxlength: 140},
	comments: [{type: Schema.Types.ObjectId, ref: "Comment"}],
	}, {timestamps: true})
var Message = mongoose.model("Message",MessageSchema);

var CommentSchema = new mongoose.Schema({
	name: {type: String, required: true, minlength: 4},
	comment: {type: String, required: true, maxlength: 140},
	_message:{type: Schema.Types.ObjectId, ref: "Message", required: true} //no orphaned comments!
})
var Comment = mongoose.model("Comment",CommentSchema);

//HELPER FOR NESTED COMMENT ERRORS------------------------------------------------------------------------------
// This function only has req,res as parameters because it must take in the same parameters as the function it's scoped to help. 
function indexWithErrors(req,res, valErrors){
	Message.find({}).populate('comments').exec(function(err, messages){
		if(err){
			console.log(err);
			res.render('index', {msgs:[], errors:err});
		}else{
			res.render('index', {msgs:messages, errors:valErrors})
		}
	})
} 																			//still never got validation errors to show... Oh well...

//ROUTES--------------------------------------------------------------------------------------------------------
app.get('/', function(req,res){
	Message.find({}, null).populate("comments").sort("-createdAt").exec(function(err, messages){
		if(err){
			console.log(err);
			res.render("index", {msgs:[], errors: err}) //empty array so it won't render at all. Don't really need it... KK is being thorough.
		}
		else{
			console.log("Got some messages: ", messages);
			res.render("index", {msgs: messages, errors:[]}) //now errors is the blank array. Don't really need it...
		}
	})
});

app.post('/messages', function(req,res){
	var aMessage = new Message(req.body);
	aMessage.save(function(err){
		if(err){
			console.log(aMessage.errors);									
			indexMessages(req,res, aMessage.errors)				//Calling the helper function here and passing it the error messages.
		}else{
			console.log("Message added: ", aMessage);
			res.redirect('/')
		}
	})
})

app.post("/comments/:id", function(req,res){
	Message.findOne({_id: req.params.id}, function(err, message){
		if(err){
			console.log(err);
			res.redirect("/")
		}else{
			var aComment = new Comment(req.body);
			aComment._message = message._id //associating the comment's foreign key of _message to the message _id.
			aComment.save(function(err){
				if(err){
					console.log(err);
					res.redirect("/")
				}else{
					//now need to add the new comment to the message's comment array.
					message.comments.push(aComment._id);
					message.save(function(err){
						if(err){
							console.log(err);
							res.redirect("/");
						}else{
							console.log("Yay");
							res.redirect("/");
						}
					})
				}
			})
		}
	})
}) //what on urf.




//SERVER LISTEN-------------------------------------------------------------------------------------------------
app.listen(8000, function(req,res){
	console.log("Message Board server running on port 8000");
})
