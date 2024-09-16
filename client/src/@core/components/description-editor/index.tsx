import React from "react";
import LoadingSpinner from "../loading-spinner";
import { STARS_COPILOT_ICON } from "src/utils/images/icons";
import ReactQuill from "react-quill";
import { FORMATS } from "src/utils/constants";
import { addBreaksAfterPeriods } from "src/utils/functions";

export const DescriptionEditor = React.useCallback(
  ({ value, quillRef, onChange, generateDescription, loading }: any) => {
    return (
      <div className="relative">
        {/* {loading ? (
          <LoadingSpinner />
        ) : (
          <img
            className="absolute cursor-pointer right-2 top-2 text-white px-2 py-1"
            onClick={generateDescription}
            src={STARS_COPILOT_ICON}
            alt="Stars Copilot"
          />
        )} */}
        <ReactQuill
          ref={quillRef}
          value={addBreaksAfterPeriods(value)}
          onChange={onChange}
          formats={FORMATS}
        />
      </div>
    );
  },
  []
);
