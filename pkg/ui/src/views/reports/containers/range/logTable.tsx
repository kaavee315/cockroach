import _ from "lodash";
import React from "react";

import * as protos from "src/js/protos";
import { FixLong } from "src/util/fixLong";
import Print from "src/views/reports/containers/range/print";

interface LogTableProps {
  rangeID: Long;
  log: protos.cockroach.server.serverpb.RangeResponse.RangeLog$Properties;
}

function printLogEventType(eventType: protos.cockroach.storage.RangeLogEventType) {
  switch (eventType) {
    case protos.cockroach.storage.RangeLogEventType.add: return "Add";
    case protos.cockroach.storage.RangeLogEventType.remove: return "Remove";
    case protos.cockroach.storage.RangeLogEventType.split: return "Split";
    default: return "Unknown";
  }
}

export default class LogTable extends React.Component<LogTableProps, {}> {
  // If there is no otherRangeID, it comes back as the number 0.
  renderRangeID(otherRangeID: Long | number) {
    const fixedOtherRangeID = FixLong(otherRangeID);
    const fixedCurrentRangeID = FixLong(this.props.rangeID);
    if (fixedOtherRangeID.eq(0)) {
      return null;
    }

    if (fixedCurrentRangeID.eq(fixedOtherRangeID)) {
      return `r${fixedOtherRangeID.toString()}`;
    }

    return (
      <a href={`#/reports/range/${fixedOtherRangeID.toString()}`}>
        r{fixedOtherRangeID.toString()}
      </a>
    );
  }

  renderLogInfoDescriptor(
    title: string, desc: string,
  ) {
    if (_.isEmpty(desc)) {
      return null;
    }
    return (
      <li>
        {title}: {desc}
      </li>
    );
  }

  renderLogInfo(info: protos.cockroach.server.serverpb.RangeResponse.RangeLog.PrettyInfo$Properties) {
    return (
      <ul className="log-entries-list">
        {this.renderLogInfoDescriptor("Updated Range Descriptor", info.updated_desc)}
        {this.renderLogInfoDescriptor("New Range Descriptor", info.new_desc)}
        {this.renderLogInfoDescriptor("Added Replica", info.added_replica)}
        {this.renderLogInfoDescriptor("Removed Replica", info.removed_replica)}
      </ul>
    );
  }

  render() {
    const { log } = this.props;
    if (!_.isEmpty(log.error_message)) {
      return (
        <div>
          <h2>Range Log</h2>
          There was an error retrieving the range log:
          {log.error_message}
        </div>
      );
    }

    if (_.isEmpty(log.events)) {
      return (
        <div>
          <h2>Range Log</h2>
          The range log is empty.
        </div>
      );
    }

    return (
      <div>
        <h2>Range Log</h2>
        <table className="log-table">
          <tbody>
            <tr className="log-table__row log-table__row--header">
              <th className="log-table__cell log-table__cell--header">Timestamp</th>
              <th className="log-table__cell log-table__cell--header">Store</th>
              <th className="log-table__cell log-table__cell--header">Event Type</th>
              <th className="log-table__cell log-table__cell--header">Range</th>
              <th className="log-table__cell log-table__cell--header">Other Range</th>
              <th className="log-table__cell log-table__cell--header">Info</th>
            </tr>
            {
              _.map(log.events, (event, key) => (
                <tr key={key} className="log-table__row">
                  <td className="log-table__cell">{Print.Timestamp(event.timestamp)}</td>
                  <td className="log-table__cell">s{event.store_id}</td>
                  <td className="log-table__cell">{printLogEventType(event.event_type)}</td>
                  <td className="log-table__cell">{this.renderRangeID(event.range_id)}</td>
                  <td className="log-table__cell">{this.renderRangeID(event.other_range_id)}</td>
                  <td className="log-table__cell">{this.renderLogInfo(log.pretty_infos[key])}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }
}
