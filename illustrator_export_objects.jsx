// Custom JSON stringify function for ExtendScript
function stringifyJSON(obj, indent) {
    var spaces = indent || 0;
    var tab = "";
    for (var i = 0; i < spaces; i++) tab += "  ";
    
    if (obj === null) return "null";
    if (typeof obj === "undefined") return "null";
    if (typeof obj === "string") return '"' + obj.replace(/"/g, '\\"') + '"';
    if (typeof obj === "number" || typeof obj === "boolean") return obj.toString();
    
    if (obj instanceof Array) {
        var items = [];
        for (var i = 0; i < obj.length; i++) {
            items.push(stringifyJSON(obj[i], spaces + 1));
        }
        return "[\n" + tab + "  " + items.join(",\n" + tab + "  ") + "\n" + tab + "]";
    }
    
    if (typeof obj === "object") {
        var items = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                items.push('"' + key + '": ' + stringifyJSON(obj[key], spaces + 1));
            }
        }
        return "{\n" + tab + "  " + items.join(",\n" + tab + "  ") + "\n" + tab + "}";
    }
    
    return '""';
}

// Script Version
var SCRIPT_VERSION = "5.0.0";

// Main export function
function exportObjectsToJSON() {
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }
    
    var doc = app.activeDocument;
    var objects = [];
    
    // Process all layers
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        processLayer(layer, objects);
    }
    
    // Process overlapping relationships
    objects = processOverlappingHierarchy(objects);
    
    // Remove duplicates
    objects = removeDuplicates(objects);
    
    // Create JSON output
    var jsonData = {
        scriptVersion: SCRIPT_VERSION,
        exportDate: new Date().toString(),
        document: doc.name,
        totalObjects: objects.length,
        objects: objects
    };
    
    // Save to file
    var jsonString = stringifyJSON(jsonData, 0);
    var jsonFile = File.saveDialog("Save JSON file", "*.json");

    if (jsonFile) {
        jsonFile.open("w");
        jsonFile.write(jsonString);
        jsonFile.close();
    }
}

function processLayer(layer, objects) {
    // Get artboard reference
    var doc = app.activeDocument;
    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artboardRect = artboard.artboardRect; // [left, top, right, bottom]
    var artboardTop = artboardRect[1]; // Top edge of artboard
    
    for (var i = 0; i < layer.pageItems.length; i++) {
        var item = layer.pageItems[i];
        
        // Get position using UnitValue for exact mm conversion
        var position = item.position;
        var docX = new UnitValue(position[0], "pt").as("mm");
        var docY = new UnitValue(position[1], "pt").as("mm");
        var artboardTopMM = new UnitValue(artboardTop, "pt").as("mm");
        
        // Convert to artboard-relative coordinates
        var x = docX;
        var y = artboardTopMM - docY; // This makes Y positive from top
        
        var width = new UnitValue(item.width, "pt").as("mm");
        var height = new UnitValue(item.height, "pt").as("mm");
        
        var objData = {
            name: item.name || "Unnamed",
            typename: item.typename,
            layer: layer.name,
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
            width: parseFloat(width.toFixed(2)),
            height: parseFloat(height.toFixed(2)),
            // Corner coordinates using UnitValue conversion
            topLeft: { 
                x: parseFloat(x.toFixed(2)), 
                y: parseFloat(y.toFixed(2))
            },
            topRight: { 
                x: parseFloat((x + width).toFixed(2)), 
                y: parseFloat(y.toFixed(2))
            },
            bottomLeft: { 
                x: parseFloat(x.toFixed(2)), 
                y: parseFloat((y + height).toFixed(2))
            },
            bottomRight: { 
                x: parseFloat((x + width).toFixed(2)), 
                y: parseFloat((y + height).toFixed(2))
            },
            type: item.typename,
            units: "mm"
        };
        
        objects.push(objData);
    }
    
    // Process sublayers
    for (var j = 0; j < layer.layers.length; j++) {
        processLayer(layer.layers[j], objects);
    }
}

function processOverlappingHierarchy(objects) {
    var mothers = [];
    var motherCount = 0;
    
    // Find all overlapping relationships
    for (var i = 0; i < objects.length; i++) {
        var objA = objects[i];
        var containedObjects = [];
        
        // Check what objects are inside this one
        for (var j = 0; j < objects.length; j++) {
            if (i === j) continue; // Skip self
            var objB = objects[j];
            
            if (isObjectInside(objB, objA)) {
                containedObjects.push(j);
            }
        }
        
        // If this object contains others, it's a mother
        if (containedObjects.length > 0) {
            motherCount++;
            objA.type = "mother " + motherCount;
            mothers.push({
                motherIndex: i,
                motherNum: motherCount,
                containedIndexes: containedObjects
            });
        }
    }
    
    // Assign sons to mothers
    for (var m = 0; m < mothers.length; m++) {
        var mother = mothers[m];
        var sonCount = 0;
        
        for (var c = 0; c < mother.containedIndexes.length; c++) {
            var sonIndex = mother.containedIndexes[c];
            sonCount++;
            objects[sonIndex].type = "son " + mother.motherNum + "-" + sonCount;
        }
    }
    
    return objects;
}

function isObjectInside(innerObj, outerObj) {
    // All coordinates are now in mm, so comparison works directly
    var innerLeft = innerObj.x;
    var innerRight = innerObj.x + innerObj.width;
    var innerTop = innerObj.y;
    var innerBottom = innerObj.y - innerObj.height;
    
    var outerLeft = outerObj.x;
    var outerRight = outerObj.x + outerObj.width;
    var outerTop = outerObj.y;
    var outerBottom = outerObj.y - outerObj.height;
    
    return (innerLeft >= outerLeft && 
            innerRight <= outerRight &&
            innerTop <= outerTop && 
            innerBottom >= outerBottom);
}

function removeDuplicates(objects) {
    var unique = [];
    var seen = {};
    
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        var key = obj.name + "|" + obj.x + "|" + obj.y + "|" + obj.layer;
        
        if (!seen[key]) {
            seen[key] = true;
            unique.push(obj);
        }
    }
    
    return unique;
}

// Run the script
exportObjectsToJSON();











