//@program
var THEME = require("themes/flat/theme");
var BUTTONS = require("controls/buttons");

deviceURL = "";

var whiteSkin = new Skin( { fill:"white" } );
var labelStyle = new Style( { font: "bold 20px", color:"black" } );
var alertStyle = new Style({font: "bold 20px", color:"red"});

Handler.bind("/retrieveData", Behavior({
	onInvoke: function(handler, message){
		hunger = parseInt(mainColumn.first.last.string);
		thirst = parseInt(mainColumn.thirstRow.thirstVal.string);
		food = parseInt(mainColumn.foodBowl.foodBowlVal.string);
		water = parseInt(mainColumn.waterBowl.waterBowlVal.string);
		cleaned = parseInt(mainColumn.cage.cageVal.string);
		cleanliness = cleaned * 10;
		weight = mainColumn.weightRow.weightVal.string;
		message.responseText = JSON.stringify( { hunger: hunger, thirst: thirst, food: food, water: water, clean: cleaned, cleanliness: cleanliness, weight: weight} );
		message.status = 200;
	}
}));

var ResetButton = BUTTONS.Button.template(function($){ return{
	right: 10, height:20,
	contents: [
		new Label({right:0, height:20, string:"Finished Cleaning", style: labelStyle})
	],
	behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
		onTouchEnded: { value: function(content){
			cleanAlert.visible = false;
		}}
	})
}});

var cleanAlert = new Line({left:0, right:0, top:0, height:30, skin:whiteSkin, name:"cleaningAlert",
			contents: [
				new Label({left:0, right:0, height:30, string:"Clean cage!", style: alertStyle}),
				new ResetButton(),
			]
		});

cleanAlert.visible = false;

Handler.bind("/cleanCage", Behavior({
	onInvoke: function(handler, message){
		cleanAlert.visible = true;
		cleanliness = parseInt(mainColumn.cleanRow.cleanVal.string);
		message.responseText = JSON.stringify( { cleanliness: cleanliness } );
		message.status = 200;
	}
}));

Handler.bind("/gotAnalogResult", Object.create(Behavior.prototype, {
	onInvoke: { value: function( handler, message ){
        		var result = message.requestObject;  
        		application.distribute( "onAnalogValueChanged", result ); 	
        	}}
}));

Handler.bind("/gotCleanlinessLevel", Object.create(Behavior.prototype, {
	onInvoke: { value: function( handler, message ){
        		var result = message.requestObject;  
        		application.distribute( "onCleanlinessValueChanged", result ); 	
        	}}
}));


var counterLabel = new Label({left:0, right:0, height:40, string:"0", style: labelStyle});
var weightLabel = new Label({left:0, right:0, height:49, string: "3", style: labelStyle});


var resetClean = new ResetButton();

var mainColumn = new Column({
	left: 0, right: 0, top: 0, bottom: 0, active: true, skin: whiteSkin,
	contents: [
		new Line({left:0, right:0, top:0, height:30, skin:whiteSkin,
			contents: [
				new Label({left:0, right:0, height:30, string:"Hunger", style: labelStyle}),
				new Label({left:0, right:0, height:30, string:"- - -", style: labelStyle, name:"hungerVal"})
			]
		}),
		new Line({left:0, right:0, top:0, height:30, skin:whiteSkin, name:"thirstRow",
			contents: [
				new Label({left:0, right:0, height:30, string:"Thirst", style: labelStyle}),
				new Label({left:0, right:0, height:30, string:"- - -", style: labelStyle, name:"thirstVal"})
			]
		}),
		new Line({left:0, right:0, top:0, height:30, skin:whiteSkin, name:"cleanRow",
			contents: [
				new Label({left:0, right:0, height:30, string:"Cleanliness", style: labelStyle}),
				new Label({left:0, right:0, height:30, string:"- - -", style: labelStyle, name:"cleanVal"})
			]
		}),
		new Line({left:0, right:0, top:0, height:30, skin:whiteSkin, name:"foodBowl",
			contents: [
				new Label({left:0, right:0, height:30, string:"Food Bowl", style: labelStyle}),
				new Label({left:0, right:0, height:30, string:"- - -", style: labelStyle, name:"foodBowlVal"})
			]
		}),
		new Line({left:0, right:0, top:0, height:30, skin:whiteSkin, name:"waterBowl",
			contents: [
				new Label({left:0, right:0, height:30, string:"Water Bowl", style: labelStyle}),
				new Label({left:0, right:0, height:30, string:"- - -", style: labelStyle, name:"waterBowlVal"})
			]
		}),
		new Line({left:0, right:0, top:0, height:30, skin:whiteSkin, name:"cage",
			contents: [
				new Label({left:0, right:0, height:30, string:"Last Cleaned", style: labelStyle}),
				new Label({left:0, right:0, height:30, string:"- - -", style: labelStyle, name:"cageVal"})
			]
		}),
		new Line({left:0, right:0, top:0, height:30, skin:whiteSkin, name:"weightRow",
			contents: [
				new Label({left:0, right:0, height:30, string:"Weight", style: labelStyle}),
				new Label({left:0, right:0, height:30, string:"- - -", style: labelStyle, name:"weightVal"})
			]
		}),
		cleanAlert
	],
	behavior: Behavior({
		onTouchEnded: function(content){
			if (deviceURL != "") {
				content.invoke(new Message(deviceURL + "retrieveData"), Message.JSON);
			}
		},
		onComplete: function(content, message, json){
			weightLabel.string = json.weight;
		},
		onAnalogValueChanged: function(content, result) {	
			content.first.last.string = Math.floor(result * 100 + 1).toString();
			content.thirstRow.thirstVal.string = (100 - Math.floor(result * 100 + 1)).toString();
			content.foodBowl.foodBowlVal.string = Math.floor(result * 300 + 1).toString();
			content.waterBowl.waterBowlVal.string = Math.floor(result * 300 + 1).toString();
			
			content.weightRow.weightVal.string = (result * 3 + 3).toString().substring(0,3);
		},
		onCleanlinessValueChanged:function(content, result) {
			content.cage.cageVal.string = Math.floor(result * 30).toString();
			content.cleanRow.cleanVal.string = (parseInt(content.cage.cageVal.string) * 10).toString();
		},
	})
});

var ApplicationBehavior = Behavior.template({
	onLaunch: function(application) {
		application.shared = true;
	},
	onQuit: function(application) {
		application.shared = false;
	},
})

/* Create message for communication with hardware pins.
    	   analogSensor: name of pins object, will use later for calling 'analogSensor' methods.
    	   require: name of js or xml bll file.
    	   pins: initializes 'analog' (matches 'analog' object in the bll)
    	  	   	 with the given pin numbers. Pin types and directions
    	  		 are set within the bll.	*/
		application.invoke( new MessageWithObject( "pins:configure", {
        	analogSensor: {
                require: "analog",
                pins: {
                    analog: { pin: 52 },
                },
            },
            cageSensor: {
                require: "cageSensor",
                pins: {
                    analog: { pin: 64 },
                }
            }
        }));
    	
    	/* Use the initialized analogSensor object and repeatedly 
    	   call its read method with a given interval.  */
		application.invoke( new MessageWithObject( "pins:/analogSensor/read?" + 
			serializeQuery( {
				repeat: "on",
				interval: 20,
				callback: "/gotAnalogResult"
		} ) ) );
		application.invoke( new MessageWithObject( "pins:/cageSensor/read?" + 
			serializeQuery( {
				repeat: "on",
				interval: 20,
				callback: "/gotCleanlinessLevel"
		} ) ) );

hunger = 0;
weight = 0;
thirst = 0;
food = 0;
water = 0;
cleaned = 0;
cleanliness = 0;
application.behavior = new ApplicationBehavior();
application.add(mainColumn);