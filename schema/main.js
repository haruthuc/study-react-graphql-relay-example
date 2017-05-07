const {GraphQLSchema,GraphQLObjectType,GraphQLString,GraphQLList,GraphQLInt} = require('graphql');
const {
    mutationWithClientMutationId,
    globalIdField,
    fromGlobalId,
    nodeDefinitions,
    connectionDefinitions,
    connectionArgs,
    connectionFromArray,
    connectionFromPromisedArray} = require('graphql-relay');
const connectionFromMongoCursor = require('relay-mongodb-connection');

const { ObjectID } = require('mongodb');

const globalIdFetcher = (globalId,{db}) =>{
    const {type, id} = fromGlobalId(globalId);
    switch (type) {
    case 'FilesLibrary':
        return filesLibrary;
    case 'File':
        return db.collection('fshare').findOne(ObjectID(id));
    case 'Tags':
        return db.collection('tags').find(ObjectID(id));
    case 'TagsLibrary':
        return tagsLibrary;
    default:
        return null;
    }
};

const globalTypeResolver = obj => obj.type || FileType;

const {nodeInterface, nodeField} = nodeDefinitions(globalIdFetcher,globalTypeResolver);

const FileType = new GraphQLObjectType({
    name: "File",
    interfaces: [nodeInterface],
    fields: {
        id: globalIdField('File',obj => obj._id),
        title : {
            type: GraphQLString
        },
        content : {
            type: GraphQLString
        },
        images : {
            type: GraphQLString
        },
        filelink : {
            type: GraphQLString
        },
        tags: {
            type: new GraphQLList(GraphQLString)
        }
    }
});

const TagType = new GraphQLObjectType({
    name: "Tag",
    interfaces: [nodeInterface],
    fields: {
        id: globalIdField('Tag',obj => obj._id),
        _id : {
            type: GraphQLString
        },
        count : {
            type: GraphQLInt
        }
    }
});


const { connectionType: TagsConnectionType} = connectionDefinitions({
    name: 'Tag',
    nodeType: TagType
});


const { connectionType: FilesConnectionType} = connectionDefinitions({
    name: 'File',
    nodeType: FileType
});

const TagsLibraryType =  new GraphQLObjectType({
    name: 'TagsLibrary',
    interfaces: [nodeInterface],
    fields: {
        id: globalIdField('TagsLibrary'),
        tagsConnection:{
            type: TagsConnectionType,
            description: "List Tags in database",
            resolve: (_,args,{db}) => {
                return connectionFromMongoCursor(
                    db.collection('tags').find({}).sort( { count: -1 } ),
                    args
                );
            }
        }
    }
    
});


let connectionArgsWithSearch = connectionArgs;
connectionArgsWithSearch.searchTerm = {
    type: GraphQLString
};


const FilesLibraryType = new GraphQLObjectType({
    name: 'FilesLibrary',
    interfaces: [nodeInterface],
    fields: {
        id: globalIdField('FilesLibrary'),
        filesConnection: {
            type: FilesConnectionType,
            description: "A List of files in Database work with model",
            args: connectionArgsWithSearch,
            resolve: (_,args,{db}) => {
                let findParams = {};
                if(args.searchTerm){
                    if(args.searchTerm.indexOf("#"==0)){
                        let tagParam = args.searchTerm.replace("#","");
                        findParams.tags =  new RegExp(tagParam,'i');
                    }else{
                        findParams.title = new RegExp(args.searchTerm,'i');
                    }
                }

                return connectionFromMongoCursor(
                    db.collection('fshare').find(findParams),
                    args
                );

                // return connectionFromPromisedArray(
                //     db.collection('fshare').find(findParams).toArray(),
                //     args
                // );
            }
        }
    }
});

const filesLibrary = {
    type: FilesLibraryType
};

const tagsLibrary = {
    type: TagsLibraryType
}

const queryType = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        node: nodeField,
        filesLibrary: {
            type: FilesLibraryType,
            description: "The Files Library",
            resolve: () => filesLibrary
        },
        tagsLibrary: {
            type: TagsLibraryType,
            description: "The Tags Library",
            resolve: () => tagsLibrary
        }
    }
});



const mySchema = new GraphQLSchema({
    query: queryType
});

module.exports = mySchema;