import React, { Component } from 'react';
import * as ReactDOM from "react-dom";
import { Post } from './Components/post';
import { Pages } from './Components/pages';
import { createBrowserRouter, RouterProvider, RouteObject } from "react-router-dom";

/* posts import */
import intro from "./content/intro.md";
import kdump from "./content/kdump.md";
import linuxkdocs from "./content/linuxkdocs.md";

const postsCount = 3;

export class Lyonaiz extends Component<{}, {data: Pages[], routes: RouteObject[]}>{
    routes:RouteObject[];

    constructor() {
        super({});
        this.routes = [];
    }

    componentWillMount(){
        fetch(intro)
            .then(res => res.text())
            .then(res =>{
                this.setStateWrapper([new Pages("intro", intro, res)]);
            })

        fetch(kdump)
            .then(res => res.text())
            .then(res => {
                this.setStateWrapper([new Pages("Using kdump", kdump, res)]);
            });

        fetch(linuxkdocs)
            .then(res => res.text())
            .then(res => {
                this.setStateWrapper([new Pages("linux generic documentation", linuxkdocs, res)]);
            })
    }

    isloaded() {
        return this.state != null && this.state.data != null && this.state.data.length === postsCount;
    }

    setStateWrapper(newPages:Pages[]){
        // set data state
        let newData:Pages[] = this.state != null && this.state.data != null ? this.state.data : [];
        this.setState({data: newData.concat(newPages)});

        // update routes
        let routes:RouteObject[] = []
        for (let page of this.state.data) {
            routes.push({
                path: page.Title,
                element: <Post pageContent={page.Content}/>
            });
        }
        this.setState({routes: routes});
        ReactDOM.createRoot(document.getElementById("root")).render(<RouterProvider router={this.state.routes} />);

    }

    postLink(name: string) {
        return <li>{name}</li>;
    }

    printPostLinks() {
        return this.state != null && this.state.data != null ? this.state.data.map((val:Pages) => this.postLink(val.Title)) : "loading...";
    }

    render(){
        if (!this.isloaded()) {
            return <div><p>loading .. wait a bit</p></div>;
        }
        else {
        return <div id="posts">

        </div>;
        }
    }
}
