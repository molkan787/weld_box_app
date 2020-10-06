<template>
  <div class="code-block" :class="{expanded}">
    <div class="header">
      Statements <span class="counts">{{ statementBlocks.length }}</span>
      <button @click="expanded = !expanded">{{ expanded ? '-' : '+' }}</button>
    </div>

    <div class="statement-blocks">
      <div v-for="(sb, index) in statementBlocks" :key="sb + index" class="item">
        <span class="name">{{ sb.name }}</span>
        <div class="statements">
          <pre>{{ sb.statements }}</pre>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  data:() => ({
    statementsCount: 2,
    expanded: false,
    statementBlocks: [
      {
        name: 'Statement Block 1',
        statements: [
          'Statement#1;',
          'Statement#2;'
        ].join('\n')
      },
      {
        name: 'Statement Block 1',
        statements: [
          'Statement#1;'
        ].join('\n')
      }
    ]
  })
}
</script>

<style lang="less" scoped>
.code-block{
  background-color: #2B2D32;
  width: 150px;
  height: 18px;
  overflow: hidden;

  &.expanded{
    height: fit-content;
  }

  div{
    position: unset;
  }

  .header{
    padding: 3px 0 0 5px;
    font-size: 11px;

    button{
      float: right;
      margin-top: -3px;
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

}
</style>
