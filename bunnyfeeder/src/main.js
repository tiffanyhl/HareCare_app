//@program
var THEME = require("themes/flat/theme");
var BUTTONS = require("controls/buttons");
var SWITCHES = require('controls/switch');
var SLIDERS = require('controls/sliders');


deviceURL = "";
autoRefill = 0;

var whiteSkin = new Skin( { fill:"white" } );
var blueSkin = new Skin({fill: "blue"});
var graySkin = new Skin({fill: "#E0EBEB"});
var btnSkin = new Skin({fill: "#3366FF", borders:{right:2, left:1, top: 1}, stroke:"gray"});
var feedBtnSkin = new Skin({fill:"#FF9933"});
var feedBtnClicked = new Skin({fill:"gray"});
var orangeSkin = new Skin ({fill: "orange", opacity: 0.3});

var hareCareLogo = new Texture("HareCare_Logo.png");

var logoSkin = new Skin({width:150, height: 100, texture: hareCareLogo, fill:"white"});
var nameStyle = new Style( { font: "bold 30px", color:"green" } );
var headerStyle = new Style({font: "bold 30px", color:"#01939f"});
var labelStyle = new Style( { font: "bold 12px", color:"black" } );
var mediumLabelStyle = new Style({font: "bold 16px", color:"black"});
var btnStyle = new Style({font:"bold 14px", color: "white"});
var alertStyle = new Style({font:"bold 15px", color: "red"});
var grayStyle = new Style({font:"bold 12px", color:"#333"});

Handler.bind("/discover", Behavior({
	onInvoke: function(handler, message){
		trace("found device");
		deviceURL = JSON.parse(message.requestText).url;
		
		if (deviceURL != "") {
			handler.invoke(new Message(deviceURL + "retrieveData"), Message.JSON);
		}
	},
	onComplete: function(handler, message, json) {
		weightDisplay.string = json.weight;
		trace("poll server");
		handler.invoke(new Message("/pollServer"));
	}
}));

Handler.bind("/pollServer", {
    onInvoke: function(handler, message){
        handler.invoke(new Message(deviceURL + "retrieveData"), Message.JSON);
    },
    onComplete: function(handler, message, json){
        hungerBar.height = json.hunger;
		thirstBar.height = json.thirst;
		cleanBar.width = json.cleanliness;
		if (cleanBar.width == 0) {
			cleaningAlert.visible = false;
		}
		cleaningSchedule.cageContainer.days.string = json.clean + " days ago";
		weightDisplay.string = json.weight + " lbs"
		if (autoRefill != 1) {
			foodBar.width = json.food;
			waterBar.width = json.water;
		}
        handler.invoke( new Message("/delay"));
    }
});

Handler.bind("/delay", {
    onInvoke: function(handler, message){
    	trace("start delay");
        handler.wait(5000); //will call onComplete after 5 seconds
    },
    onComplete: function(handler, message){
        handler.invoke(new Message("/pollServer"));
    }
});

Handler.bind("/clean", Behavior({
	onInvoke: function(handler, message){
		handler.invoke(new Message(deviceURL + "cleanCage"), Message.JSON);
	},
	onComplete: function(handler, message, json){
        trace("cleaning")
        cleanBar.width = json.cleanliness;
    } 
}));

Handler.bind("/forget", Behavior({
	onInvoke: function(handler, message){
		deviceURL = "";
	}
}));



var logo = new Container({left:0, right:0, top:10, height: 100, skin:logoSkin});
var mainPicture = new Picture({url: "bunny.png", height:130, left:0, right:0, top:-30, borders:{bottom:5}, stroke:"black"});
var thirstBar = new Container({left:5, right:5, height:60, bottom:0, skin:blueSkin});
var hungerBar = new Container({left:5, right:5, height:100, bottom:0, skin:orangeSkin});
var weightDisplay = new Label({left:5, right:5, bottom:0, string: "3.4 lbs", style:nameStyle});

var statsContainer = new Line({
	left: 10, right: 10, top:10, bottom: 0, skin: whiteSkin,
	contents: [
		hungerBar,
		thirstBar,
		weightDisplay
	]
});

var labelsContainer = new Line({
	left: 10, right: 10, bottom: 15, height:50, skin: whiteSkin,
	contents:[
		new Label({left: 5, right: 5, top:0, bottom: 0, string: "Hunger", style: labelStyle}),
		new Label({left: 5, right: 5, top:0, bottom: 0, string: "Thirst", style: labelStyle}),
		new Label({left: 5, right: 5, top:0, bottom: 0, string: "Weight", style: labelStyle})
	]
});


var mainColumn = new Column({
	left: 0, right: 0, top: 0, bottom: 50, active: true, skin: graySkin,
	contents: [
		logo,
		mainPicture,
		statsContainer
	]
});

var MySwitchTemplate = SWITCHES.SwitchButton.template(function($){ return{
	height:50, width: 100,
	behavior: Object.create(SWITCHES.SwitchButtonBehavior.prototype, {
		onValueChanged: { value: function(container){
			SWITCHES.SwitchButtonBehavior.prototype.onValueChanged.call(this, container);
			trace("Value is: " + this.data.value + "\n");
			if (this.data.value == 1) {
				autoRefill = 1;
				feedingSchedule.food.first.width = 300;
				feedingSchedule.water.first.width = 300;
			} else {
				autoRefill = 0;
			}
	}}})
}});

var MySlider = SLIDERS.HorizontalSlider.template(function($){ return{
	height:50, left:50, right:50,
	behavior: Object.create(SLIDERS.HorizontalSliderBehavior.prototype, {
		onValueChanged: { value: function(container){
			SLIDERS.HorizontalSliderBehavior.prototype.onValueChanged.call(this, container);
			trace("Value is: " + Math.floor(this.data.value) + "\n");
	}}})
}});

var slider = new MySlider({ min:1, max:12, value:8,  });
var theSwitch = new MySwitchTemplate({ value: 0 });


var feedingButton = BUTTONS.Button.template(function($){ return{
	left: 50, right: 50, height:50, bottom:10, skin:feedBtnSkin,
	contents: [
		new Label({left:0, right:0, height:50, string:$.btnName, style: btnStyle})
	],
	behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
		onTouchBegan: { value: function(content){
			content.skin = feedBtnClicked;
			if ($.btnName == "Dispense Hay") {
				if (hungerBar.height - 20 > 0) {
				    hungerBar.height -= 20;
				} else {
				    hungerBar.height = 1;
				}
				if (feedingSchedule.food.first.width + 60 <= 300) {
					feedingSchedule.food.first.width += 60;
				}
			}
			else if ($.btnName == "Dispense Water") {
				if (thirstBar.height - 20 > 0) {
					thirstBar.height -= 20;
				} else {
				    thirstBar.height = 1;
				}
				if (feedingSchedule.water.first.width + 60 <= 300) {
					feedingSchedule.water.first.width += 60;
				}
			} else {
			}
		}},
		onTouchEnded: { value: function(content, message, json){
			if ($.btnName == "Clean Cage") {
				cleaningAlert.visible = true;
				content.invoke(new Message("/clean"));
			}
			content.skin = feedBtnSkin;
		}}
	})
}});

var dispenseHay = new feedingButton({btnName: "Dispense Hay"});
var dispenseWater = new feedingButton({btnName: "Dispense Water"});
var cleanBtn = new feedingButton({btnName: "Clean Cage"});
var foodBar = new Container({left:0, height:20, width:0, skin:blueSkin});
var waterBar = new Container({left:0, height:20, width:0, skin:blueSkin});
var cleaningAlert = new Label({left:0, right:0, height:20, string:"Cleaning...", style:alertStyle});
cleaningAlert.visible = false;

var feedingSchedule = new Column({
	left: 0, right:0, top:0, bottom:50, skin:graySkin,
	contents: [
		new Label({left:0, right:0, bottom:20, height:50, string:"Feeding Schedule", style: headerStyle}),
		dispenseHay,
		dispenseWater,
		new Label({left:10, top:20, string:"Food Bowl", style: labelStyle}),
		new Container({width: 300, height:20, skin:whiteSkin, name:"food",
			contents: [
			    foodBar
			]
		}),
		new Label({left:10, top:10, string:"Water Bowl", style: labelStyle}),
		new Container({top:0, width:300, height:20, skin:whiteSkin, name:"water",
			contents: [
			    waterBar
			]
		}),
		new Label({top: 20, left:0, right:0, height:20, string:"Auto-Refill", style: mediumLabelStyle}),
		theSwitch,
	]
});

var cleanBar = new Container({left:0, width:50, height:20, skin:blueSkin});

var cleaningSchedule = new Column({
	left: 0, right:0, top:0, bottom:50, skin:graySkin,
	contents: [
		new Label({left:0, right:0, height:50, string:"Cleaning Schedule", style: headerStyle}),
		new Label({left:0, right:0, height:50, string:"Cage Cleanliness", style: mediumLabelStyle}),
		new Container({left:10, right: 10, height:20, skin:whiteSkin,
			contents: [
				cleanBar
			]
		}),
		new Container({left:0, right:0, skin:graySkin,
			contents:[
				new Label({top:5, left:10, string:"Clean", style:labelStyle}),
				new Label({top:5, right:10, string:"Dirty", style:labelStyle}),
			]
		}),
		new Label({top:20, left:0, right:0, string:"Cage Last Cleaned:", style: mediumLabelStyle}),
		new Container({left:0, right:0, bottom:20, name:"cageContainer",
			contents: [
				new Label({left:0, right:0, string:"0 days ago", style: labelStyle, name:"days"}),
			]
		}),
		cleanBtn,
		cleaningAlert
	]
});


var menuButton = BUTTONS.Button.template(function($){ return{
	left: 0, right: 0, height:50, skin:btnSkin,
	contents: [
		new Label({left:0, right:0, height:50, string:$.btnName, style: grayStyle})
	],
	behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
		onTouchBegan: { value: function(content){
			content.skin = graySkin;
			if ($.btnName == "Feed") {
				cleaningSchedule.visible = false;
				mainColumn.visible = false;
				feedingSchedule.visible = true;
			}
			else if ($.btnName == "Pet Profile") {
				feedingSchedule.visible = false;
				cleaningSchedule.visible = false;
				mainColumn.visible = true;
			} else {
				feedingSchedule.visible = false;
				mainColumn.visible = false;
				cleaningSchedule.visible = true;
			}
		}},
		onTouchEnded: { value: function(content, message, json){
			if ($.btnName == "Feed") {
				prof.skin = btnSkin;
				clean.skin = btnSkin;
			}
			else if ($.btnName == "Pet Profile") {
				feed.skin = btnSkin;
				clean.skin = btnSkin;
			} else {
				feed.skin = btnSkin;
				prof.skin = btnSkin;
			}
		}}
	})
}});

var prof = new menuButton({btnName: "Pet Profile"});
prof.skin = graySkin;
var feed = new menuButton({btnName: "Feed"});
var clean = new menuButton({btnName: "Clean"});

var bottomMenu = new Line({
	left: 0, right: 0, bottom: 0, height:50, active: true, skin: blueSkin,
	contents: [
		prof,
		feed,
		clean
	]
});


var ApplicationBehavior = Behavior.template({
	onDisplayed: function(application) {
		application.discover("bunnyserver.app");
	},
	onQuit: function(application) {
		application.forget("bunnyserver.app");
	},
})

application.behavior = new ApplicationBehavior();

application.add(bottomMenu);
application.add(cleaningSchedule);
application.add(feedingSchedule);
application.add(mainColumn);
mainColumn.add(labelsContainer);