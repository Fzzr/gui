// Main App Wrapper
// ================
// Top level controller-view for FreeNAS webapp

"use strict";

import React from "react";

import { RouteHandler } from "react-router";

import routerShim from "../mixins/routerShim";

// WebApp Components
import BusyBox from "../components/BusyBox";
import ContextBar from "./ContextBar";
import PrimaryNavigation from "./PrimaryNavigation";
import DebugTools from "./DebugTools";

// WEBPACK RESOURCES
if ( process.env.BROWSER ) {
  require( "../../../styles/core.less" );
}

const FreeNASWebApp = React.createClass(
  { getInitialState () {
      return { cssBust: ""
             };
    }

  , componentDidMount () {
      if ( module.hot ) {
        module.hot.addStatusHandler( this.cssBust );
      }
    }

  , componentWillUnmount () {
      if ( module.hot ) {
        module.hot.removeStatusHandler( this.cssBust );
      }
    }

  , cssBust ( hmrState ) {
      if ( hmrState === "idle" ) {
        this.setState(
          { cssBust: "?" + new Date().getTime() / 1000
          }
        );
      }
    }

  , getParent( child, testClass ) {
      let parent = null;

      if ( child ) {
        parent = testClass
               ? ( child.parentNode.classList.contains( testClass )
                 ? child.parentNode
                 : null
                 )
               : child.parentNode;
      }

      return parent;
    }

  , render: function () {
    return (
    <html>
      <head>
        {/* Charset Definition */}
        <meta charSet="utf-8"/>
        <title>FreeNAS 10 GUI</title>

        {/* Robot Instructions */}
        <meta name="robots" content="noindex, nofollow" />

        {/* Favicons */}
        <link
          rel   = "icon"
          type  = "image/png"
          href  = "/favicon-32x32.png"
          sizes = "32x32"
        />
        <link
          rel   = "icon"
          type  = "image/png"
          href  = "/favicon-16x16.png"
          sizes = "16x16"
        />

        {/* Primary Styles */}
        <link rel="stylesheet" type="text/css" href={ "/extract.css" + this.state.cssBust } />
        <script type="text/javascript" src="/js/data-window-props.js"></script>
      </head>
      <body>
        {/* Modal windows for busy spinner and/or FreeNAS login. */}
        <BusyBox />

        <div className="app-content">
          {/* Primary navigation menu */}
          <PrimaryNavigation />

          <div className="app-view">
            {/* Primary view */}
            { this.props.children }

            <footer className="app-footer">
              {/* TODO? */}
            </footer>
          </div>

          {/* User-customizable component showing system events */}
          <ContextBar />
        </div>

        {/* Hidden, user-callable developer tools */}
        <DebugTools />

        {/* Main app code */}
        <script type="text/javascript" src="/js/app.js"></script>
      </body>
    </html>
    );
  }

  }
);

export default FreeNASWebApp;
