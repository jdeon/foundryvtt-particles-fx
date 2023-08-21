import customPrefillTemplateApi from "../api/templateController.js"
import emitApi from "./emitController.js";

export default {
    emit: emitApi,
    template: customPrefillTemplateApi,
}