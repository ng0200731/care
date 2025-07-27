function collectLayerObjects(layer, objects) {
    for (var i = 0; i < layer.pageItems.length; i++) {
        var item = layer.pageItems[i];
        var bounds = item.geometricBounds; // [top, left, bottom, right]
        
        // CRITICAL FIX: Ensure proper coordinate order
        var left = Math.min(bounds[1], bounds[2]);   // leftmost
        var right = Math.max(bounds[1], bounds[2]);  // rightmost  
        var top = Math.max(bounds[0], bounds[3]);    // topmost
        var bottom = Math.min(bounds[0], bounds[3]); // bottommost
        
        var obj = {
            name: item.name || "Unnamed_" + objects.length,
            typename: item.typename,
            layer: layer.name,
            x: left,
            y: top,
            width: right - left,
            height: top - bottom,
            // GUARANTEED correct corners
            topLeft: { x: left, y: top },
            topRight: { x: right, y: top },
            bottomLeft: { x: left, y: bottom },
            bottomRight: { x: right, y: bottom }
        };
        
        objects.push(obj);
    }
}

function isCompletelyInside(inner, outer) {
    // Fixed containment logic
    return (inner.x >= outer.x &&                           // left edge
            inner.x + inner.width <= outer.x + outer.width && // right edge  
            inner.y - inner.height >= outer.y - outer.height && // bottom edge
            inner.y <= outer.y);                            // top edge
}

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

// Main export function
function exportFixedCoordinates() {
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }
    
    var doc = app.activeDocument;
    var allObjects = [];
    
    // Get all objects from all layers
    for (var i = 0; i < doc.layers.length; i++) {
        collectLayerObjects(doc.layers[i], allObjects);
    }
    
    // Calculate relationships
    var processedObjects = calculateRelationships(allObjects);
    
    // Create JSON output
    var jsonData = {
        scriptVersion: "7.0.0",
        exportDate: new Date().toString(),
        document: doc.name,
        totalObjects: processedObjects.length,
        objects: processedObjects
    };
    
    // Save to file
    var jsonString = stringifyJSON(jsonData, 0);
    var jsonFile = File.saveDialog("Save Fixed Coordinates", "*.json");

    if (jsonFile) {
        jsonFile.open("w");
        jsonFile.write(jsonString);
        jsonFile.close();
        alert("Fixed coordinates exported successfully!");
    }
}

function calculateRelationships(objects) {
    var mothers = [];
    var motherCount = 0;
    
    // Find all mother-son relationships
    for (var i = 0; i < objects.length; i++) {
        var mother = objects[i];
        var sons = [];
        
        // Check what objects are inside this one
        for (var j = 0; j < objects.length; j++) {
            if (i === j) continue; // Skip self
            var child = objects[j];
            
            if (isCompletelyInside(child, mother)) {
                sons.push(j);
            }
        }
        
        // If this object contains others, it's a mother
        if (sons.length > 0) {
            motherCount++;
            mother.type = "mother " + motherCount;
            
            // Mark all sons
            for (var s = 0; s < sons.length; s++) {
                var sonIndex = sons[s];
                objects[sonIndex].type = "son " + motherCount + "-" + (s + 1);
            }
        }
    }
    
    return objects;
}

// Run the script
exportFixedCoordinates();
