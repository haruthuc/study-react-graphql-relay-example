import React, { Component } from 'react';

import ReactDOM from 'react-dom';

import PropTypes from 'prop-types';

import Relay from 'react-relay';

import {debounce} from 'lodash';

import {Affix, Layout, Input, Col, Row ,Card, Anchor,Icon,Tag} from 'antd';

const { Header, Footer, Sider, Content } = Layout;
const Search = Input.Search;
const { Link } = Anchor;


class File extends Component {
    render(){
        let tags = this.props.file.tags || [];
        return (
            <Card style={{ width: '100%',display: 'block',float:'left',margin:5 }} bodyStyle={{ padding: 0 }}>
                <div className="custom-image">
                    <img alt={this.props.file.title}  src={this.props.file.images} />
                </div>
                <div className="custom-card">
                    <h3><a href={this.props.file.filelink} > {this.props.file.title} </a></h3>
                    <p>
                        <Icon type="tag" />
                        {
                            
                            tags.map((tag,tagIndex)=> <span key={tagIndex}> {tag} ,</span> )
                        }
                    </p>
                    <br/>
                    <h3> Content </h3>
                     <p style={{maxWidth:800}}>
                        {this.props.file.content?this.props.file.content:""}
                    </p>
                    <a type="button" className="ant-btn ant-btn-primary" href={this.props.file.filelink} target="_blank"> Fshare Download Link </a>
                </div>
            </Card>
        );
    }

}

File = Relay.createContainer(File,{
    fragments: {
        file:() => Relay.QL `
            fragment OneFile on File {
                id,
                filelink,
                tags,
                images,
                title,
                content
            }
        `
    }
});
 


class FileList extends Component {
    render(){
        return (
            <div>
            {this.props.items.map((item,itemIndex) => 
                <File key={item.node.id} file={item.node}/>
            )
            }
            </div>
        );
    }
}
FileList.propTypes = {
    items: PropTypes.array.isRequired
}

class TagItem extends Component{
    handleClick(event){
        this.props.onSearch(this.props.name);
    }
    render(){
        return(
            <Tag color={this.props.selected?"orange":null} data={this.props.name} onClick={this.handleClick.bind(this)}>{this.props.name} ( {this.props.count} )</Tag>
        );
    }
}
class TagsLibrary extends Component{
    constructor(){
        super(...arguments);
        this.state = {
            selectedTag : ''
        }
        this.handleTagClick = debounce(this.handleTagClick.bind(this),300);
    }
    handleTagClick(tagName){   
        this.props.onSearch("#"+tagName);
        this.setState({
            selectedTag: tagName
        });
    }
    render(){
        return (<div>
            {   
                this.props.tags.map((tag,tagIndex) => <TagItem selected={this.state.selectedTag==tag.node.name?true:false} onSearch={this.handleTagClick} key={tagIndex} name={tag.node.name} count={tag.node.count} />)
            }
        </div>);
    }
}

// TagsList.propTypes = {
//     tags : PropTypes.array.isRequired
// }

class FilesLibrary extends Component {
    constructor(props){
        super(props);
        this.handleSearch = debounce(this.handleSearch.bind(this),300);
    }
    handleSearch(searchTerm){
         this.props.relay.setVariables({searchTerm:searchTerm});
    }
    handleLoadMoreClick(){
        this.props.relay.setVariables({
          count: this.props.relay.variables.count + 10,
        });
    }
  render() {
    return (
      <Layout>
        <Affix>
        <Header  style={{ backgroundColor: '#108ee9' }}>
            <Row>
                <Col span={3}>
                     <h2 style={{ color: '#FFFFFF' }} >FshareFile</h2>
                </Col>
                <Col span={12}>
                      <Search
                            placeholder="input search text"
                            style={{ width: 500 }}
                            onSearch={this.handleSearch}
                        />
                </Col>
            </Row>
        </Header>
    </Affix>
      <Layout>
        <Sider style={{background: '#fff', padding: 24, margin: 0, minHeight: 580 }}>
        
                <h3>Tags:</h3>
                <TagsLibrary tags={this.props.tagsLibrary.tagsConnection.edges} onSearch={this.handleSearch}/>
            
        </Sider>
        <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 580 }}>
            <FileList items={this.props.library.filesConnection.edges} />
            {
                this.props.library.filesConnection.pageInfo.hasNextPage ?
                 <button className="btn-loadmore" onClick={this.handleLoadMoreClick.bind(this)}>Load more</button>:null}
            
        </Content>
        
      </Layout>
      <Footer>FshareFile </Footer>
    </Layout>

    );
  }
}
// FilesLibrary.propTypes = {
//     items: PropTypes.array.isRequired
// }



FilesLibrary = Relay.createContainer(FilesLibrary,{
    initialVariables: {
        count: 10,
        searchTerm:''
    },
    fragments: {
        library: () => Relay.QL `
            fragment on FilesLibrary {
               filesConnection(first:$count,searchTerm:$searchTerm) {
                   edges {
                       node {
                           id
                           ${File.getFragment('file')}
                       }
                   }
                    pageInfo {
                        hasNextPage
                        hasPreviousPage
                        startCursor
                        endCursor
                    }
               }
            }`,
            tagsLibrary: () => Relay.QL `
                    fragment on TagsLibrary{
                            tagsConnection{
                                edges {
                                    node {
                                        name:_id
                                        count
                                    }
                                }
                            }
                        }
                `
    }
});

// TagsLibrary = Relay.createContainer(TagsLibrary,{
//     fragments: {
//         tagsLibrary: () => Relay.QL `
//                  fragment on TagsLibrary{
//                         tagsConnection{
//                             edges {
//                                 node {
//                                     id
//                                     name:_id
//                                     count
//                                 }
//                             }
//                         }
//                     }
//             `
//     }
// });


class AppRoute extends Relay.Route {
    static routeName = 'App';
    static queries = {
        library:(Component) => Relay.QL `
            query FilesLibrary{
                filesLibrary {
                    ${Component.getFragment('library')}
                }
            }
        `,
        tagsLibrary:(Component) => Relay.QL `
            query TagsLibrary{
                tagsLibrary {
                    ${Component.getFragment('tagsLibrary')}
                }
            }
        `
        
    }
}

ReactDOM.render(
    <Relay.RootContainer Component={FilesLibrary} route={new AppRoute()} renderLoading={function() {
        return <div>Loading...</div>;
    }} />,
    document.getElementById('root')
)


