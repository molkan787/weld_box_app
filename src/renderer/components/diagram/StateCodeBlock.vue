<template>
  <div class="code-block">
    <div class="header">
      Statements <span class="counts">{{ statementBlocks.length }}</span>
      <div class="toggle" :class="{ collapsed: !expanded }" @click="expanded = !expanded">
        <ArrowTopIcon :width="12" :height="7.5" />
      </div>
    </div>

    <div v-if="expanded">
      <div class="statement-blocks">
        <div v-for="(sb, index) in statementBlocks" :key="sb + index" class="item">
          <div class="sb-header">
            <input v-model="sb.name" type="text">
            <button @click="removeBlock(sb)" title="Remove">
              <CloseIcon :size="9" />
            </button>
          </div>
          <div class="statements">
            <div class="execution">
              <div :class="{checked: sb.execution.en}" @click="sb.execution.en = !sb.execution.en" class="item">EN</div>
              <div :class="{checked: sb.execution.du}" @click="sb.execution.du = !sb.execution.du" class="item">DU</div>
              <div :class="{checked: sb.execution.ex}" @click="sb.execution.ex = !sb.execution.ex" class="item">EX</div>
            </div>
            <textarea v-model="sb.statements" cols="30" rows="10"></textarea>
          </div>
        </div>
      </div>

      <button @click="addBlockClick" class="add-block">
        Add Statement Block
      </button>
    </div>

  </div>
</template>

<script>
import ArrowTopIcon from '../icons/ArrowTop';
import CloseIcon from '../icons/Close';
export default {
  components: {
    ArrowTopIcon,
    CloseIcon
  },
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  data:() => ({
    expanded: true,
  }),
  computed: {
    statementBlocks(){
      return this.state.statementBlocks;
    }
  },
  methods: {
    removeBlock(sb){
      const arr = this.state.statementBlocks;
      const index = arr.indexOf(sb);
      index >= 0 && arr.splice(index, 1);
    },
    addBlockClick(){
      const arr = this.state.statementBlocks;
      const block = {
        name: `Statement Block ${arr.length + 1}`,
        statements: 'Statement#1;',
        execution: {
          en: false,
          du: false,
          ex: false,
        }
      }
      arr.push(block);
    }
  },
  mounted(){
    // this.addBlockClick();
  }
}
</script>

<style lang="less" scoped>
.code-block{
  background-color: #2B2D32;
  width: 180px;
  overflow: hidden;
  height: fit-content;

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
          outline-color: #23BB72;
          min-width: 0;
          flex: 1;
        }
        button{
          width: 24px;
          border: none;
          background: none;
          outline: none;
          cursor: pointer;
        }
      }
      .statements{
        margin-left: 10px;
        border-left: 2px solid #68696D;
        padding: 5px;

        textarea{
          min-width: 96%;
          max-width: 96%;
          height: 50px;
          background: none;
          border: none;
          color: white;
          font-size: 15px;
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
    padding: 9px;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover{
      background-color: #17181b;
    }
  }

}
</style>
