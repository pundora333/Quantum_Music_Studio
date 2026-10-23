const copy=x=>JSON.parse(JSON.stringify(x));
export function stableJSON(x){if(Array.isArray(x))return '['+x.map(stableJSON).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stableJSON(x[k])).join(',')+'}';return JSON.stringify(x);}
export class EditHistory{
 constructor(initial,limit=80){this.current=copy(initial);this.limit=limit;this.past=[];this.future=[];this.transaction=null;}
 begin(label='Edit'){if(this.transaction)return false;this.transaction={before:copy(this.current),label};return true;}
 observe(next,label='Edit'){if(stableJSON(this.current)===stableJSON(next))return false;const before=this.current;this.current=copy(next);if(!this.transaction){this.past.push({state:copy(before),label});if(this.past.length>this.limit)this.past.shift();this.future=[];}return true;}
 end(next=this.current){if(!this.transaction)return this.observe(next);const t=this.transaction;this.transaction=null;this.current=copy(next);if(stableJSON(t.before)===stableJSON(next))return false;this.past.push({state:t.before,label:t.label});if(this.past.length>this.limit)this.past.shift();this.future=[];return true;}
 undo(){if(this.transaction)this.end();if(!this.past.length)return null;const entry=this.past.pop();this.future.push({state:copy(this.current),label:entry.label});this.current=copy(entry.state);return copy(this.current);}
 redo(){if(this.transaction)this.end();if(!this.future.length)return null;const entry=this.future.pop();this.past.push({state:copy(this.current),label:entry.label});this.current=copy(entry.state);return copy(this.current);}
 get canUndo(){return !!this.past.length;}get canRedo(){return !!this.future.length;}
}
