define(['dojo/_base/declare',
        'esri/layers/FeatureLayer',
        'esri/dijit/Search',
        "esri/tasks/query",
        "esri/InfoTemplate",
        "esri/tasks/QueryTask",
        "jimu/loaderplugins/jquery-loader!//code.jquery.com/jquery-3.2.1.min.js",
        'esri/layers/GraphicsLayer',
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/Color",
        'jimu/BaseWidget'
       ],
    function (declare,
            FeatureLayer,
            Search,
            Query,
            InfoTemplate,
            QueryTask,
            $,
            GraphicsLayer,
            SimpleFillSymbol,
            SimpleLineSymbol,
            Color,
            BaseWidget) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {
            // Custom widget code goes here
            
            baseClass: 'jimu-widget-customwidget',
            
            //this property is set by the framework when widget is loaded.
            //name: 'SpecialDistrict',
            
            //methods to communication with app container:
            
            // postCreate: function() {
            //   this.inherited(arguments);
            //   console.log('postCreate');
            // },
            
            startup: function () {
                var thisWidget = this;
                
                thisWidget.inherited(arguments);
                
                // declare address feature layer as the layer to search for addresses
                var searchLayer = new FeatureLayer(thisWidget.config.addressSearchURL,{
                    outFields: ["*"]
                });
                
                
                // initiate search functions and variables
                var search = new Search({
                    map: thisWidget.map,
                    sources: [],
                    zoomScale: 2500
                 }, "search-submit");
                
                search.on("load", function () {
                    
                    var sources = search.sources;
                    sources.push({
                       featureLayer: searchLayer,
                       placeholder: "Enter an Address",
                       enableLabel: false,
                       searchFields: ["ADDRESS"],
                       displayField: "ADDRESS",
                       exactMatch: false,
                       outFields: ["*"],
                    });

                    search.set("sources", sources);
                 });
                search.startup();
                
                // call function to get the geometry results of the search
                thisWidget._onSearchComplete(search, thisWidget);
                
                // functions for when "New Search" button is clicked.
                $("#new-search").on('click', function(){
                    thisWidget.map.infoWindow.hide();
                    thisWidget.map.graphics.clear();
                    $("#new-search").addClass('hidden');
                    $("#initial-search").removeClass('hidden');
                    $("#results-list").empty();
                    search.clear();
                });
                
                console.log('startup');
            },
            
            onOpen: function () {
                console.log('onOpen');
            },
            
            onClose: function () {
                var thisWidget = this;
                
                // functions called when search window is closed
                thisWidget.map.infoWindow.hide();
                thisWidget.map.graphics.clear();
                $("#initial-search").removeClass('hidden');
                $("#results-list").empty();
                console.log('onClose');
            },
            
            _onSearchComplete: function(s, thisWidget){
                
                // 'search-results' is an event that provieds results of the search. Argument 's' came from search variable in startup function
                s.on('search-results', function(searchResult){
                    
                    // call function to use search result and query that against the special district layers
                    thisWidget._querySpecialDistricts(searchResult, thisWidget);
                    
                    // once search is complete, change html to show/hide elements
                    $("#new-search").removeClass('hidden');
                    $("#initial-search").addClass('hidden');
                    $("#results-list").html("<h2>Special Districts for <b><em>" + this.value + "</em></b></h2>");
                    $("#results-list").removeClass('hidden');                
                })
            },
            
            _querySpecialDistricts: function(searchResult, thisWidget){
                
                // variable with layer objects. names are need to populate results list. urls are used as part of the query
                var layerURLs = [{
                        name: "Park District",
                        url: thisWidget.config.parkDistrictURL
                    },{
                        name: "Regional Transportation District",
                        url: thisWidget.config.regionalTransportationDistrictURL
                    },{
                        name: "Water District",
                        url: thisWidget.config.waterDistrictURL
                    },{
                        name: "Water and Sanitation District",
                        url: thisWidget.config.watAndSanDistrictURL
                    },{
                        name: "Urban Renewal District",
                        url: thisWidget.config.urbanRenewDistrictURL
                    },{
                        name: "Ambulance District",
                        url: thisWidget.config.ambulanceDistrict
                    },{
                        name: "Fire District",
                        url: thisWidget.config.fireDistrict
                    },{
                        name: "Fire Bond District",
                        url: thisWidget.config.fireBondDistrict
                    },{
                        name: "Sanitation District",
                        url: thisWidget.config.sanitationDistrict
                    },{
                        name: "Improvement District",
                        url: thisWidget.config.improvementDistrict
                    },{
                        name: "Metro District",
                        url: thisWidget.config.metroDistrict
                    }
                ];
                
                for (var i = 0; i < layerURLs.length; i++) {
                    
                    var layerName = layerURLs[i].name;
                    var layerURL = layerURLs[i].url;
                    
                    var layer = new FeatureLayer(layerURL, {
                        outfields: ["*"],
                        id: layerName
                    });
                    
                    var queryTask = QueryTask(layer.url, {
                        name: layerName
                    });
                    var query = new Query();
                    query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                    query.geometry = searchResult.results[0][0].feature.geometry;
                    query.returnGeometry = true;
                    
                    // function to get query results and layer name together. it was necessary to create a function and pass variables.
                    thisWidget._executeQueryTask(queryTask, query, layerName, thisWidget);
                }
            },
            
            _executeQueryTask: function(queryTask, query, layerName, thisWidget){
                queryTask.execute(query, function(featureSet){
                    if (featureSet.features.length > 0){
                        
                        var resultList = document.getElementById('results-list');
                        
                        var layerDiv = document.createElement('div');
                        layerDiv.id = layerName;
                        layerDiv.innerHTML = ("<br>District: " + layerName);
                        resultList.appendChild(layerDiv);
                        
                        for (var t = 0; t < featureSet.features.length; t++) {
                            
                            var nameDiv = document.createElement('div');
                            
                            if (featureSet.features[t].attributes.hasOwnProperty("NAME")){
                                nameDiv.id = featureSet.features[t].attributes.NAME;
                                nameDiv.innerHTML = ("&nbsp;&nbsp;&nbsp;Name: <b>" + featureSet.features[t].attributes.NAME + "</b>")
                                layerDiv.appendChild(nameDiv);
                            } else {
                                nameDiv.id = featureSet.features[t].attributes.DISTRICT;
                                nameDiv.innerHTML = ("&nbsp;&nbsp;&nbsp;District: <b>" + featureSet.features[t].attributes.DISTRICT + "</b>")
                                layerDiv.appendChild(nameDiv);
                            }
                        }
                    }
                });
            }
        });
    });
