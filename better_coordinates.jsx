// Better Coordinates - Simple and Clear
function getAllCoordinates() {
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
    
    // Export to JSON
    exportToJSON(processedObjects, doc.name);
}

function collectLayerObjects(layer, objects) {
    for (var i = 0; i < layer.pageItems.length; i++) {
        var item = layer.pageItems[i];
        var bounds = item.geometricBounds; // [top, left, bottom, right]
        
        // FIXED: Use consistent coordinate system
        var left = bounds[1];
        var top = bounds[0]; 
        var right = bounds[2];
        var bottom = bounds[3];
        
        var obj = {
            name: item.name || "Unnamed_" + objects.length,
            typename: item.typename,
            layer: layer.name,
            // Use top-left as reference (standard)
            x: left,
            y: top,
            width: Math.abs(right - left),
            height: Math.abs(top - bottom),
            // CORRECT 4 corners
            topLeft: { x: left, y: top },
            topRight: { x: right, y: top },
            bottomLeft: { x: left, y: bottom },
            bottomRight: { x: right, y: bottom }
        };
        
        objects.push(obj);
    }
    
    // Recursively check sublayers
    for (var j = 0; j < layer.layers.length; j++) {
        collectLayerObjects(layer.layers[j], objects);
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

function isCompletelyInside(inner, outer) {
    // Simple area check: inner object must be completely inside outer
    return (inner.x >= outer.x &&                           // left edge
            inner.x + inner.width <= outer.x + outer.width && // right edge
            inner.y >= outer.y &&                           // top edge
            inner.y + inner.height <= outer.y + outer.height); // bottom edge
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

function exportToJSON(objects, docName) {
    var jsonData = {
        scriptVersion: "6.0.0",
        exportDate: new Date().toString(),
        document: docName,
        totalObjects: objects.length,
        objects: objects
    };
    
    // Use custom stringify function instead of JSON.stringify
    var jsonString = stringifyJSON(jsonData, 0);
    
    // Save file
    var file = File.saveDialog("Save coordinates", "*.json");
    if (file) {
        file.open("w");
        file.write(jsonString);
        file.close();
        alert("Coordinates exported successfully!");
    }
}

// Run the script
getAllCoordinates();



