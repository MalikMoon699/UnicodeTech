import { foramteDateTimeDay } from "../utils/helper";
import { renderMessage } from "./Custom.RichTextArea";

export const ReportCard = ({ report }) => {
  return (
    <div className="day-end-card">
      <h3 className="day-end-card-date">
        {foramteDateTimeDay(report?.createdAt)}
      </h3>
      <div className="day-end-card-text style-import">
        {renderMessage(report.content)}
      </div>
    </div>
  );
};
