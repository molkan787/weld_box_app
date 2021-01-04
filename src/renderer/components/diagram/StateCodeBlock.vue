<template>
  <div class="code-block" :style="`width:${rootWidth}px`">
    <div @mousedown="mousedown" class="cb-resize-handle" preventDrag="true" ></div>
    <div class="header">
      Actions <span class="counts">{{ statementBlocks.length }}</span>
      <div class="toggle" :class="{ collapsed: !state.codeblocksExpanded }" @click="state.codeblocksExpanded = !state.codeblocksExpanded">
        <ArrowTopIcon :width="12" :height="7.5" />
      </div>
    </div>

    <div v-if="state.codeblocksExpanded">
      <div class="statement-blocks">
        <div v-for="(sb, index) in statementBlocks" :key="sb + index" class="item">
          <!-- <div class="sb-header">
            <input v-model="sb.name" type="text">
            <button class="rm-block-btn" @click="removeBlock(index)" title="Remove">
              <CloseIcon :size="9" />
            </button>
          </div> -->
          <div class="statements">
            <div class="execution">
              <div :class="{checked: sb.execution.en}" @click="sb.execution.en = !sb.execution.en" class="item">EN</div>
              <div :class="{checked: sb.execution.du}" @click="sb.execution.du = !sb.execution.du" class="item">DU</div>
              <div :class="{checked: sb.execution.ex}" @click="sb.execution.ex = !sb.execution.ex" class="item">EX</div>
              <button class="rm-block-btn" @click="removeBlock(index)" title="Remove">
                <CloseIcon :size="9" />
              </button>
            </div>
            <textarea v-bind="{[USE_NATIVE_CLIPBOARD]: '1'}" ref="itemsTextAreas" v-model="sb.statements" cols="30" rows="10"></textarea>
          </div>
        </div>
      </div>

      <button @click="addBlockClick" class="add-block">
        <PlusSignIcon :size="14" />
      </button>
    </div>

  </div>
</template>

<script>
import { Component } from '../../diagram-core/components/component';
import { textareaFitContentHeight } from '../../helpers/ui';
import { USE_NATIVE_CLIPBOARD } from '../../symbols';
import ArrowTopIcon from '../icons/ArrowTop';
import CloseIcon from '../icons/Close';
import PlusSignIcon from '../icons/PlusSign';
export default {
  components: {
    ArrowTopIcon,
    CloseIcon,
    PlusSignIcon
  },
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  data:() => ({
    expanded: false,
    startX: 0,
    startWidth: 0,
    resizing: false,
    rootWidth: 180,
    USE_NATIVE_CLIPBOARD: USE_NATIVE_CLIPBOARD
  }),
  computed: {
    statementBlocks(){
      return this.state.statementBlocks;
    }
  },
  watch: {
    statementBlocks: {
      deep: false,
      handler(){
        if(this.expanded){
          this.$nextTick(() => this.prepareTextareas());
        }
      }
    },
    expanded(val){
      if(val){
        this.$nextTick(() => this.prepareTextareas());
      }
    }
  },
  methods: {
    /**
     * Starts the panel resizing process
     */
    mousedown(e){
      this.startWidth = this.rootWidth;
      this.startX = e.clientX;
      this.resizing = true;
      const mousemoveHandler = event => this.mousemove(event);
      const mouseupHandler = () => {
        this.resizing = false;
        window.removeEventListener('mousemove', mousemoveHandler);
        window.removeEventListener('mouseup', mouseupHandler);
      };
      window.addEventListener('mousemove', mousemoveHandler);
      window.addEventListener('mouseup', mouseupHandler);
    },
    mousemove(e){
      if(this.resizing){
        const deltaX = e.clientX - this.startX;
        let width = this.startWidth + deltaX;
        if(width < 180) width = 180;
        this.rootWidth = width;
        this.prepareTextareas();
      }
    },
    prepareTextareas(){
      const els = this.$refs.itemsTextAreas;
      if(els){
        for(let i = 0; i < els.length; i++){
          textareaFitContentHeight(els[i]);
        }
      }
    },
    removeBlock(index){
      index >= 0 && this.state.statementBlocks.splice(index, 1);
    },
    addBlockClick(){
      const arr = this.state.statementBlocks;
      const block = {
        id: Component.genId(),
        name: `Action Block ${arr.length + 1}`,
        statements: 'Action#1;',
        execution: {
          en: false,
          du: false,
          ex: false,
        }
      }
      arr.push(block);
    }
  }
}
</script>

<style lang="less" scoped>
.code-block{
  background-color: #2B2D32;
  overflow: hidden;
  height: fit-content;

  .cb-resize-handle{
    position: absolute;
    top: 0;
    left: 100%;
    margin-left: -8px;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
  }

  div{
    position: unset;
  }

  .header{
    padding: 4px 0 3px 7px;
    font-size: 12px;

    .toggle{
      position: absolute;
      width: 22px;
      height: 21px;
      top: 0;
      left: calc(100% - 22px);
      border-left: 1.5px solid #212327;
      box-sizing: border-box;
      text-align: center;
      cursor: pointer;
      padding-top: 2px;
      padding-right: 1px;
      &.collapsed > svg{
        transform: scale(-1);
      }
    }

    .counts{
      display: inline-block;
      background-color: #18191D;
      color: #8B8C8E;
      border-radius: 50%;
      padding: 1px 0;
      font-size: 10px;
      width: 14px;
      display: inline-block;
      text-align: center;
    }
  }

  .statement-blocks{
    & > .item{
      margin: 5px 0;
      .sb-header{
        display: flex;
        width: 100%;
        flex-direction: row;
        input{
          border: none;
          background: none;
          color: rgb(185, 185, 185);
          padding: 3px 3px 3px 6px;
          min-width: 0;
          flex: 1;
          &:focus{
            outline: 1px solid #23BB72;
          }
        }
      }
      .rm-block-btn{
        width: 24px;
        border: none;
        background: none;
        outline: none;
        cursor: pointer;
        float: right;
        margin-top: 4px;
      }
      .statements{
        margin-left: 5px;
        border-left: 2px solid #68696D;
        padding-left: 3px;

        textarea{
          width: 96%;
          height: 50px;
          background: none;
          border: none;
          color: white;
          font-size: 15px;
          resize: none;
          &:focus{
            outline: 1px solid #23BB72;
          }
        }

        .execution{
          padding-bottom: 6px;

          & > .item{
            display: inline-block;
            font-size: 12px;
            font-weight: bold;
            background-color: #18191D;
            border-radius: 50px;
            padding: 2px 11px;
            cursor: pointer;
            &.checked{
              background-color: #3B3D44;
            }
          }

        }
      }
    }
  }

  .add-block{
    display: inline-block;
    width: 100%;
    border: none;
    color: white;
    background-color: #121316;
    outline: none;
    font-size: 14px;
    white-space: nowrap;
    padding: 3px 9px;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover{
      background-color: #17181b;
    }
    svg{
      position: relative;
      top: 2px;
      // left: -5px;
    }
  }

}
</style>
