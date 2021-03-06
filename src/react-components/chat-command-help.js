import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/chat-command-help.scss";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";

export default class ChatCommandHelp extends Component {
  static propTypes = {
    matchingPrefix: PropTypes.string,
    onTop: PropTypes.bool
  };

  render() {
    const commands = ["leave", "fly", "grow", "shrink", "duck", "debug", "scene <scene url>", "rename <new name>"];

    return (
      <div className={classNames({ [styles.commandHelp]: true, [styles.commandHelpOnTop]: this.props.onTop })}>
        {commands.map(
          c =>
            (this.props.matchingPrefix === "" ||
              c.split(" ")[0].startsWith(this.props.matchingPrefix.split(" ")[0])) && (
              <div className={styles.entry} key={c}>
                <div className={styles.command}>/{c}</div>
                <div>
                  <FormattedMessage id={`commands.${c.split(" ")[0]}`} />
                </div>
              </div>
            )
        )}
      </div>
    );
  }
}
