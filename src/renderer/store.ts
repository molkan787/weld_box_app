import Vue from 'vue'
import Vuex from 'vuex'
import { ProjectSetting } from './interfaces/ProjectSetting'
import { MyDiagram } from './my-diagram/my-diagram'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    projectState: {
      /** Indicates whether the currently loaded project is total saved or not (not: the user changed something and did not save it yet) */
      saved: true,
    },
    projectSetting: <ProjectSetting | null>{},
    diagram: <MyDiagram | null>null,
  }
})
