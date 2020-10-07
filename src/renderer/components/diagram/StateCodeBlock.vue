<template>
  <div class="code-block">
    <div class="header">
      Statements <span class="counts">{{ statementBlocks.length }}</span>
      <button @click="expanded = !expanded">{{ expanded ? '-' : '+' }}</button>
    </div>

    <div v-if="expanded">
      <div class="statement-blocks">
        <div v-for="(sb, index) in statementBlocks" :key="sb + index" class="item">
          <span class="name">{{ sb.name }}</span>
          <div class="statements">
            <pre>{{ sb.statements }}</pre>
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
export default {
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  data:() => ({
    statementsCount: 2,
    expanded: true,
  }),
  computed: {
    statementBlocks(){
      return this.state.statementBlocks;
    }
  },
  methods: {
    addBlockClick(){
      const arr = this.state.statementBlocks;
      const block = {
        name: `Statement Block ${arr.length + 1}`,
        statements: 'Statement#1;'
      }
      arr.push(block);
    }
  }
}
</script>

<style lang="less" scoped>
.code-block{
  background-color: #2B2D32;
  width: 150px;
  height: 18px;
  overflow: hidden;
  height: fit-content;

  div{
    position: unset;
  }

  .header{
    padding: 3px 0 0 5px;
    font-size: 11px;

    button{
      float: right;
      margin-top: -2px;
      margin-right: 1px;
      height: 16px;
      padding: 0px 4px;
    }

    .counts{
      background-color: #18191D;
      border-radius: 50%;
      padding: 1px;
      font-size: 10px;
      width: 14px;
      display: inline-block;
      text-align: center;
    }
  }

  .statement-blocks{
    .item{
      margin: 5px 0;
      .name{
        color: rgb(185, 185, 185);
        padding: 3px;
      }
      .statements{
        margin-left: 8px;
        border-left: 2px solid #68696D;
        padding: 5px;
        pre{
          margin: 0;
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
