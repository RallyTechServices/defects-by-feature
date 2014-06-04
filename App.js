
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
    items:[ 
        {xtype:'container', itemId:'selector_box'},
        {xtype:'container',itemId:'display_box'}
    ],
    
    launch: function() {
        this.down('#selector_box').add({
            xtype:'rallybutton',
            text:'Choose Feature',
            margin: 5,
            listeners: {
                scope: this,
                click: function(){
                    this._showFeatureChooser();
                }
            }
        });
       
        
    },
    _showFeatureChooser: function(){
        console.log('here we are');
        Ext.create('Rally.ui.dialog.ChooserDialog',{
            artifactTypes:['portfolioitem/feature'],
            autoShow: true,
            title:'Feature Chooser',
            listeners: {
                scope: this,
                artifactChosen: function(selected_record){
                    console.log(selected_record);
                    this._getStoriesWithDefectFor(selected_record);
                }
            }
        });
    },
    _getStoriesWithDefectFor:function(feature){
        
        var feature_filter = Ext.create('Rally.data.QueryFilter',{
            property:'Feature.ObjectID', value: feature.get("ObjectID")
        });
        
        var not_closed_filter = Ext.create('Rally.data.QueryFilter',{
            property:'DefectStatus', value:'NONE_CLOSED'
        });
        
        var some_closed_filter = Ext.create('Rally.data.QueryFilter',{
            property:'DefectStatus', value:'SOME_CLOSED'
        });
        
        var state_filter = some_closed_filter.or(not_closed_filter);
        var filter = state_filter.and(feature_filter);
        
        console.log(filter.toString());
        
        var defects = [];
        Ext.create('Rally.data.WsapiDataStore',{
            model:'HierarchicalRequirement',
            filters: filter,
            fetch: ['FormattedID','State','Defects','Name','Owner','Severity'],
            autoLoad: true,
            listeners: {
                scope: this,
                load: function(store,stories){
                    console.log('stories',stories);
                    Ext.Array.each(stories,function(story){
                        Ext.Array.each(story.get('Defects'), function(defect){
                            if ( defect.State !== "Closed" ) {
                                defect.Story = story;
                                defects.push(defect);
                            }
                        });
                    });
                    
                    console.log(defects);
                    this._addGrid(defects);
                }
            }
        });
    },
    _addGrid: function(defects) {
        var defect_store = Ext.create('Rally.data.custom.Store',{ data: defects });
        
        this.grid = this.down('#display_box').add({
            xtype: 'rallygrid',
            store: defect_store,
            columnCfgs: [
                { dataIndex:'FormattedID', text: 'id' },
                { dataIndex:'State', text: 'State' },
                { dataIndex:'Name', text: 'Name', flex: 1 },
                { dataIndex:'Owner', text: 'Owner', renderer: function(value) {
                        var display_value = "NONE";
                        if ( value ) {
                            display_value = value._refObjectName;
                        }
                        return display_value 
                    }
                },
                { dataIndex: 'Severity', text: 'Severity' },
                { dataIndex: 'Story', text: 'Story', renderer: function(story) {
                        var story_hash = story.getData();
                        
                        var url = "/detail/userstory/" + story_hash.ObjectID;
                        var anchor = "<a href='" + url + "' target='_blank'>";
                        return anchor + story_hash.FormattedID + "</a>: " + story_hash.Name;
                    }
                }
            ]
        });
    }
});
