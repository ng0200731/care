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
var SCRIPT_VERSION = "4.2.0";

// Illustrator Object Export Script
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
    
    // Apply outer frame and inner object logic
    objects = processFrameHierarchy(objects);
    
    // Create JSON with version info
    var jsonData = {
        scriptVersion: SCRIPT_VERSION,
        exportDate: new Date().toString(),
        document: doc.name,
        totalObjects: objects.length,
        objects: objects
    };
    
    // Export to file with save dialog
    var jsonString = stringifyJSON(jsonData, 0);
    var jsonFile = File.saveDialog("Save JSON file", "*.json");

    if (jsonFile) {
        jsonFile.open("w");
        jsonFile.write(jsonString);
        jsonFile.close();
    }
}

function processTextContent(textContent) {
    if (!textContent) return null;
    
    // Check if it's a care label (mother)
    if (textContent.indexOf("[CARE LABEL]") !== -1) {
        if (textContent.indexOf("page 1") !== -1) {
            return "mother 1";
        } else if (textContent.indexOf("page 2") !== -1) {
            return "mother 2";
        }
        return "mother";
    }
    
    // Check if it's a child object
    if (textContent.indexOf("object") !== -1) {
        // Extract object number (e.g., "object2-3" -> "son-3")
        var match = textContent.match(/object\d+-(\d+)/);
        if (match) {
            return "son-" + match[1];
        }
    }
    
    return null;
}

function processLayer(layer, objects) {
    // Skip the "label" layer entirely
    if (layer.name === "label") {
        return;
    }
    
    for (var i = 0; i < layer.pageItems.length; i++) {
        var item = layer.pageItems[i];
        var bounds = item.geometricBounds;
        
        var objData = {
            name: item.name || "Unnamed",
            typename: item.typename,
            layer: layer.name,
            x: bounds[1],
            y: bounds[0],
            width: Math.abs(bounds[2] - bounds[1]),
            height: Math.abs(bounds[0] - bounds[2])
        };
        
        // Process text content and determine type
        if (item.typename === "TextFrame" && item.contents) {
            var processedType = processTextContent(item.contents);
            if (processedType) {
                objData.type = processedType;
            } else {
                objData.type = item.typename;
            }
        } else {
            objData.type = item.typename;
        }
        
        objects.push(objData);
    }
    
    // Process sublayers
    for (var j = 0; j < layer.layers.length; j++) {
        processLayer(layer.layers[j], objects);
    }
}

function processFrameHierarchy(objects) {
    var mothers = [];
    
    // Step 1: Find all mother objects
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        if (obj.type && obj.type.indexOf("mother") !== -1) {
            mothers.push(obj);
        }
    }
    
    // Step 2: For each non-mother object, check if it's inside a mother
    for (var j = 0; j < objects.length; j++) {
        var obj = objects[j];
        
        // Skip if it's already a mother
        if (obj.type && obj.type.indexOf("mother") !== -1) {
            continue;
        }
        
        // Check which mother contains this object
        for (var k = 0; k < mothers.length; k++) {
            var mother = mothers[k];
            
            if (isInsideFrame(obj, mother)) {
                // Extract mother number (e.g., "mother 2" -> "2")
                var motherNum = mother.type.replace("mother ", "");
                
                // Count position among objects in this mother
                var position = 0;
                for (var p = 0; p < objects.length; p++) {
                    var checkObj = objects[p];
                    if (checkObj.type && checkObj.type.indexOf("mother") === -1 && 
                        isInsideFrame(checkObj, mother)) {
                        position++;
                        if (checkObj === obj) break;
                    }
                }
                
                obj.type = "son " + motherNum + "-" + position;
                break;
            }
        }
        
        // If not inside any mother, keep original type
        if (obj.type && obj.type.indexOf("son") === -1 && obj.type.indexOf("mother") === -1) {
            // Keep as is for non-mother, non-son objects
        }
    }
    
    return objects;
}

function isInsideFrame(innerObj, outerFrame) {
    // Use a proximity-based approach instead of strict containment
    var distance = Math.sqrt(
        Math.pow(innerObj.x - outerFrame.x, 2) + 
        Math.pow(innerObj.y - outerFrame.y, 2)
    );
    
    // If objects are close enough (within 200 units), consider them related
    return distance < 200;
}

function removeDuplicates(objects) {
    var unique = [];
    var seen = {};
    
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        var key = obj.name + "|" + obj.type + "|" + obj.layer;
        
        if (!seen[key]) {
            seen[key] = true;
            unique.push(obj);
        }
    }
    
    return unique;
}

// Run the script
exportObjectsToJSON();









