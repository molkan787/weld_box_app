import Vue from 'vue'
import Vuex from 'vuex'
import { ProjectSetting } from './interfaces/ProjectSetting'
import { MyDiagram } from './my-diagram/my-diagram'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    projectSetting: <ProjectSetting>{},
    diagram: <MyDiagram | null>null,
  }
})
