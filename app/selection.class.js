export default class Selection {
  constructor(id) {
    this.container = document.getElementById(id);

    this.element = document.createElement('div');
    this.element.className = 'selection';
    this.container.appendChild(this.element);

    this.area = { x: 0, y: 0, width: 0, height: 0 };
    this.offset = [0, 0];
    this.startX = 0;
    this.startY = 0;

    this.container.onmousedown = (event) => {
      this.move = true;
      this.rect = this.container.getBoundingClientRect();
      this.offset = [-this.rect.left, -this.rect.top];
      this.startX = event.clientX;
      this.startY = event.clientY;
    }

    this.container.onmousemove = (event) => {
      if(this.move){
        let translate = [event.clientX - this.startX, event.clientY - this.startY];

        this.area.width = Math.abs(translate[0]);
        this.area.height = Math.abs(translate[1]);

        this.area.x = translate[0] >= 0 ? this.startX : event.clientX;
        this.area.y = translate[1] >= 0 ? this.startY : event.clientY;

        this.area.x += this.offset[0];
        this.area.y += this.offset[1];

        this._render();
      }
    }

    document.addEventListener('mouseup', (event) => {
      if(this.move){
        //check if inside
        if(event.clientX >= this.rect.left && event.clientX <= this.rect.left + this.rect.width && event.clientY >= this.rect.top && event.clientY <= this.rect.top + this.rect.height){
          //is inside
          if(this.area.width && this.area.height && this.onSelected){
            this.onSelected(this.area);
          }
        }else{
          this.area = { x: 0, y: 0, width: 0, height: 0 };
          this._render();
        }
        this.move = false;
      }
    })

  }

  _render() {
    this.element.style.left = this.area.x;
    this.element.style.top = this.area.y;
    this.element.style.width = this.area.width;
    this.element.style.height = this.area.height;
  }

}
